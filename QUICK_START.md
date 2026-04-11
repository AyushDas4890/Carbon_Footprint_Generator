# ⚡ Quick Start Guide

## 🎯 3 Steps to Start Tracking

### 1️⃣ Setup (First Time Only)
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create categories
python manage.py init_categories

# Create admin account
python manage.py createsuperuser

# Start server
python manage.py runserver
```

### 2️⃣ Login
1. Go to: `http://127.0.0.1:8000/admin`
2. Login with your superuser credentials
3. Navigate to: `http://127.0.0.1:8000` (main app)

### 3️⃣ Start Logging!
- Click **"Add Activity"** → Fill form → **Save**
- View **Dashboard** to see your carbon footprint
- Check **History** to see all activities

---

## 📝 Logging an Activity

**Required Fields:**
- ✅ Category (Food/Transport/Energy)
- ✅ Description (e.g., "Drove 20 miles")
- ✅ Carbon Amount (e.g., `8.0` kg CO₂)

**Quick Carbon Reference:**
- Car: 0.4 kg CO₂ per mile
- Beef burger: 3.5 kg CO₂
- Electricity: 0.5 kg CO₂ per kWh

---

## 📊 Viewing Your Data

**Dashboard** (`/`):
- Total carbon this month
- Goal progress
- Category breakdown
- Recent activities

**History** (`/history/`):
- All activities
- Search & filter
- Delete activities

**Profile** (`/profile/`):
- Set monthly goal
- View current progress

---

## 🔑 Key URLs

- Main App: `http://127.0.0.1:8000`
- Admin: `http://127.0.0.1:8000/admin`
- Dashboard: `http://127.0.0.1:8000/`
- Add Activity: `http://127.0.0.1:8000/add/`
- History: `http://127.0.0.1:8000/history/`
- Profile: `http://127.0.0.1:8000/profile/`

---

**For detailed instructions, see `USAGE_GUIDE.md`**
