# 📖 Carbon Footprint Tracker - Complete Usage Guide

## 🚀 Quick Start: Getting the App Running

### Step 1: Initial Setup (One-time)

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   copy .env.example .env  # Windows
   # Edit .env and add: SECRET_KEY=your-secret-key-here
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Initialize categories:**
   ```bash
   python manage.py init_categories
   ```

5. **Create admin account:**
   ```bash
   python manage.py createsuperuser
   ```
   Enter username, email, and password when prompted.

6. **Start the server:**
   ```bash
   python manage.py runserver
   ```

7. **Open your browser:**
   - Go to: `http://127.0.0.1:8000`

---

## 🔐 Step 2: Login to Your Account

1. **Visit the admin panel:**
   - Go to: `http://127.0.0.1:8000/admin`
   - Or click "Admin" in the navigation bar

2. **Login with your superuser credentials:**
   - Enter the username and password you created

3. **You'll be redirected to the admin panel**

4. **To access the main app:**
   - Click on the site name or go to: `http://127.0.0.1:8000`
   - You should now see the Dashboard!

---

## 📝 How to Log Activities

### Method 1: Using the "Add Activity" Button

1. **From the Dashboard:**
   - Click the **"➕ Log New Activity"** button
   - Or click **"Add Activity"** in the navigation bar

2. **Fill out the form:**
   - **Category** (required): Select from dropdown
     - 🍔 Food
     - 🚗 Transport  
     - ⚡ Energy
   
   - **Description** (required): Describe your activity
     - Examples:
       - "Drove 20 miles to work"
       - "Ate a beef burger for lunch"
       - "Used 50 kWh of electricity"
   
   - **Cost** (optional): Enter the cost in dollars
     - Example: `15.50`
   
   - **Carbon Amount** (required): Enter kg CO₂ equivalent
     - Example: `8.0` (for 20 miles of driving)
     - See reference values below
   
   - **Receipt/Image** (optional): Upload a photo
     - Click "Choose File" and select an image
     - Useful for keeping receipts

3. **Click "Save Activity"**
   - You'll see a success message
   - You'll be redirected to the Dashboard

### Method 2: Quick Reference for Carbon Values

Use these common values when logging:

| Activity | Carbon Amount (kg CO₂) |
|----------|----------------------|
| Car (gasoline) - 1 mile | 0.4 |
| Car (gasoline) - 20 miles | 8.0 |
| Flight - 1 mile | 0.25 |
| Flight - 500 miles | 125.0 |
| Beef burger | 3.5 |
| Chicken meal | 1.0 |
| Electricity - 1 kWh | 0.5 |
| Electricity - 100 kWh | 50.0 |
| Natural gas - 1 kWh | 0.2 |
| Bus ride - 10 miles | 0.5 |

**Example Activities:**
- "Drove to grocery store (5 miles)" → Carbon: `2.0` kg CO₂
- "Ate lunch at restaurant (beef)" → Carbon: `3.5` kg CO₂
- "Home electricity usage (200 kWh)" → Carbon: `100.0` kg CO₂

---

## 📊 How to Track Your Carbon Footprint

### Viewing the Dashboard

The Dashboard shows:

1. **Total Carbon This Month**
   - Large number showing your total kg CO₂ for the current month

2. **Monthly Goal**
   - Your set monthly carbon footprint goal

3. **Goal Progress**
   - Percentage bar showing how close you are to your goal
   - Green bar fills up as you approach your limit

4. **Carbon by Category**
   - Table showing breakdown by Food, Transport, Energy
   - See which category contributes most to your footprint

5. **Recent Activities**
   - Last 5 activities you logged
   - Quick view of your recent entries

### Setting Your Monthly Goal

1. **Click "Profile" in the navigation bar**

2. **Enter your monthly goal:**
   - Example: `1000` (for 1000 kg CO₂ per month)
   - Average person: 1000-2000 kg CO₂/month
   - Ambitious goal: 500-800 kg CO₂/month

3. **Click "Save Changes"**

4. **Return to Dashboard** to see your progress bar update!

---

## 📜 How to View Your History

### Accessing History

1. **Click "History" in the navigation bar**
   - Or click "View All History →" from Dashboard

### What You'll See

1. **Total Carbon Footprint**
   - Sum of all your logged activities

2. **Search Functionality**
   - Type in the search box to find activities
   - Searches by description
   - Example: Search "car" to find all driving activities

3. **Category Filter**
   - Select a category from dropdown
   - Shows only activities in that category
   - Select "All Categories" to see everything

4. **Activity Table**
   - **Date**: When you logged the activity
   - **Category**: Food, Transport, or Energy
   - **Description**: What you did
   - **Cost**: Money spent (if entered)
   - **Carbon**: kg CO₂ for that activity
   - **Actions**: Delete button

### Filtering Activities

**Example 1: Find all transport activities**
1. Go to History page
2. Select "Transport" from category dropdown
3. Click "Filter"
4. See only your transportation activities

**Example 2: Search for specific activity**
1. Type "burger" in search box
2. Click "Filter" (or press Enter)
3. See all activities containing "burger"

**Example 3: Clear filters**
1. Click "Clear" button
2. See all activities again

### Deleting Activities

1. **From History page:**
   - Find the activity you want to delete
   - Click "Delete" button in the Actions column
   - Confirm deletion in the popup

2. **Or from delete confirmation page:**
   - Review the activity details
   - Click "Yes, Delete" to confirm
   - Or "Cancel" to go back

---

## 🎯 Complete Workflow Example

### Day 1: Setting Up

1. ✅ Login to admin panel
2. ✅ Set monthly goal: 1000 kg CO₂
3. ✅ Log first activity: "Drove to work (15 miles)" → 6.0 kg CO₂

### Day 2: Regular Tracking

1. ✅ Log breakfast: "Coffee and pastry" → 0.5 kg CO₂
2. ✅ Log commute: "Drove to work (15 miles)" → 6.0 kg CO₂
3. ✅ Log lunch: "Beef burger" → 3.5 kg CO₂
4. ✅ Check Dashboard: See total is 16.0 kg CO₂ (1.6% of goal)

### Day 3: Reviewing Progress

1. ✅ View History: See all 4 activities
2. ✅ Filter by "Food": See coffee and burger
3. ✅ Check Dashboard: See "Food" category has 4.0 kg CO₂
4. ✅ Log more activities throughout the day

### Weekly Review

1. ✅ Go to Dashboard
2. ✅ Check "Carbon by Category" table
3. ✅ See which category is highest (probably Transport)
4. ✅ Adjust behavior: Maybe take bus instead of driving!

---

## 💡 Tips for Effective Tracking

1. **Log activities immediately** - Don't wait, you might forget!

2. **Be consistent** - Log daily to get accurate data

3. **Use descriptions** - Be specific: "Drove 20 miles" not just "Drove"

4. **Set realistic goals** - Start with your current average, then reduce gradually

5. **Review weekly** - Check which categories are highest

6. **Upload receipts** - Keep photos of receipts for reference

7. **Use the search** - Find patterns in your behavior

---

## 🆘 Troubleshooting

### "I can't see the Dashboard"
- Make sure you're logged in
- Go to `/admin` and login first
- Then visit `http://127.0.0.1:8000`

### "No categories in dropdown"
- Run: `python manage.py init_categories`

### "Can't save activities"
- Make sure you filled required fields (Category, Description, Carbon Amount)
- Check that Carbon Amount is a number (e.g., 5.5 not "five")

### "Dashboard shows 0 kg CO₂"
- Make sure you've logged some activities
- Check that activities are from the current month
- Go to History to see all your activities

### "Can't delete activities"
- Make sure you're logged in as the user who created the activity
- Only your own activities can be deleted

---

## 🎓 Next Steps

Once you're comfortable with logging activities:

1. **Try Phase 2 features** (when implemented):
   - AI receipt scanner
   - Eco-chat assistant
   - Automatic carbon scoring

2. **Set challenging goals** - Reduce your monthly goal gradually

3. **Share your progress** - Track improvements over time

4. **Analyze patterns** - Use History filters to find your biggest carbon sources

---

**Happy Tracking! 🌱**
