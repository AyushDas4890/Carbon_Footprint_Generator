from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import ActivityLog, CarbonCategory, UserProfile, ChatMessage
from .forms import ActivityLogForm, UserProfileForm, ReceiptScanForm, EcoChatForm
from .ai import extract_receipt_ai, estimate_carbon_ai, eco_chat_reply


@login_required
def dashboard(request):
    """Main dashboard showing carbon footprint summary"""
    # Get or create user profile
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    # Get current month's activities
    now = timezone.now()
    start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total carbon this month
    total_carbon = ActivityLog.objects.filter(
        user=request.user,
        date__gte=start_of_month
    ).aggregate(Sum('carbon_amount'))['carbon_amount__sum'] or 0
    
    # Carbon by category
    carbon_by_category = ActivityLog.objects.filter(
        user=request.user,
        date__gte=start_of_month
    ).values('category__name').annotate(
        total=Sum('carbon_amount')
    ).order_by('-total')
    
    # Recent activities (last 5)
    recent_activities = ActivityLog.objects.filter(
        user=request.user
    ).select_related('category').order_by('-date')[:5]
    
    # Goal progress
    goal_progress = profile.get_goal_progress() if profile.monthly_goal > 0 else 0
    
    # Weekly comparison
    week_ago = now - timedelta(days=7)
    last_week_total = ActivityLog.objects.filter(
        user=request.user,
        date__gte=week_ago,
        date__lt=start_of_month
    ).aggregate(Sum('carbon_amount'))['carbon_amount__sum'] or 0
    
    context = {
        'profile': profile,
        'total_carbon': total_carbon,
        'carbon_by_category': carbon_by_category,
        'recent_activities': recent_activities,
        'goal_progress': goal_progress,
        'last_week_total': last_week_total,
    }
    
    return render(request, 'tracker/dashboard.html', context)


@login_required
def add_activity(request):
    """View to add a new activity"""
    if request.method == 'POST':
        form = ActivityLogForm(request.POST, request.FILES)
        if form.is_valid():
            activity = form.save(commit=False)
            activity.user = request.user
            if activity.carbon_amount is None:
                activity.carbon_amount = estimate_carbon_ai(
                    description=activity.description,
                    category_name=(activity.category.name if activity.category else None),
                )
            activity.save()
            messages.success(request, 'Activity logged successfully!')
            return redirect('tracker:dashboard')
    else:
        form = ActivityLogForm()
    
    return render(request, 'tracker/add_activity.html', {'form': form})


@login_required
def history(request):
    """View to display all activity history"""
    activities = ActivityLog.objects.filter(
        user=request.user
    ).select_related('category').order_by('-date')
    
    # Filter by category if provided
    category_filter = request.GET.get('category')
    if category_filter:
        activities = activities.filter(category__name=category_filter)
    
    # Search functionality
    search_query = request.GET.get('search')
    if search_query:
        activities = activities.filter(
            Q(description__icontains=search_query)
        )
    
    # Total carbon footprint
    total_carbon = activities.aggregate(Sum('carbon_amount'))['carbon_amount__sum'] or 0
    
    # Get all categories for filter dropdown
    categories = CarbonCategory.objects.all()
    
    context = {
        'activities': activities,
        'total_carbon': total_carbon,
        'categories': categories,
        'selected_category': category_filter,
        'search_query': search_query,
    }
    
    return render(request, 'tracker/history.html', context)


@login_required
def edit_profile(request):
    """View to edit user profile and monthly goal"""
    profile, created = UserProfile.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        form = UserProfileForm(request.POST, instance=profile)
        if form.is_valid():
            form.save()
            messages.success(request, 'Profile updated successfully!')
            return redirect('tracker:dashboard')
    else:
        form = UserProfileForm(instance=profile)
    
    return render(request, 'tracker/edit_profile.html', {'form': form, 'profile': profile})


@login_required
def delete_activity(request, activity_id):
    """View to delete an activity"""
    activity = get_object_or_404(ActivityLog, id=activity_id, user=request.user)
    
    if request.method == 'POST':
        activity.delete()
        messages.success(request, 'Activity deleted successfully!')
        return redirect('tracker:history')
    
    return render(request, 'tracker/delete_activity.html', {'activity': activity})


@login_required
def receipt_scan(request):
    """
    Upload a receipt/photo -> AI extracts fields -> prefill the Add Activity form.
    """
    extracted = None
    prefill = {}

    if request.method == "POST":
        scan_form = ReceiptScanForm(request.POST, request.FILES)
        if scan_form.is_valid():
            img = scan_form.cleaned_data["image"]
            extraction = extract_receipt_ai(img.read())
            extracted = extraction

            # Map category string to existing CarbonCategory if possible
            category_obj = None
            if extraction.category:
                category_obj = CarbonCategory.objects.filter(name__iexact=extraction.category).first()

            prefill = {
                "category": category_obj.id if category_obj else None,
                "description": extraction.description or "",
                "cost": extraction.cost,
                "carbon_amount": extraction.carbon_amount,
            }
            form = ActivityLogForm(initial=prefill)
            messages.success(request, "Receipt scanned. Please review and save the activity.")
            return render(
                request,
                "tracker/receipt_scan.html",
                {"scan_form": scan_form, "form": form, "extracted": extracted},
            )
    else:
        scan_form = ReceiptScanForm()

    return render(request, "tracker/receipt_scan.html", {"scan_form": scan_form})


@login_required
def eco_chat(request):
    """
    Simple chat UI backed by OpenAI (or rule-based fallback).
    Injects last 5 activities as context.
    """
    # Load chat history
    history_qs = ChatMessage.objects.filter(user=request.user).order_by("-created_at")[:20]
    history = list(reversed(history_qs))

    if request.method == "POST":
        form = EcoChatForm(request.POST)
        if form.is_valid():
            user_msg = form.cleaned_data["message"].strip()
            if user_msg:
                ChatMessage.objects.create(user=request.user, role="user", content=user_msg)

                last_acts = (
                    ActivityLog.objects.filter(user=request.user)
                    .select_related("category")
                    .order_by("-date")[:5]
                )
                ctx = [
                    {
                        "category": (a.category.name if a.category else None),
                        "description": a.description,
                        "carbon_amount": str(a.carbon_amount) if a.carbon_amount is not None else None,
                        "date": a.date.isoformat(),
                    }
                    for a in last_acts
                ]
                reply = eco_chat_reply(user_msg, ctx)
                ChatMessage.objects.create(user=request.user, role="assistant", content=reply)
                return redirect("tracker:eco_chat")
    else:
        form = EcoChatForm()

    return render(request, "tracker/eco_chat.html", {"form": form, "messages": history})
