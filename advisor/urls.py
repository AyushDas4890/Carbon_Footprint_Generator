from django.urls import path
from . import views

urlpatterns = [
    path('advisor/', views.advisor_page, name='advisor'),
    path('api/advisor/chat/', views.ChatView.as_view(), name='advisor_chat'),
    path('api/advisor/chat/stream/', views.stream_chat_view, name='advisor_chat_stream'),
    path('api/advisor/decompose/', views.BoMDecomposeView.as_view(), name='advisor_decompose'),
]
