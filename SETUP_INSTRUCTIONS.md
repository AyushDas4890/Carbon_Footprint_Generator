# 🔧 Setup Instructions - Database Issue Resolution

## ⚠️ Current Issue

The database file (`db.sqlite3`) appears to be locked by another process. This is preventing migrations from running.

## 🔍 Troubleshooting Steps

### Step 1: Close All Django Processes

1. **Check if Django server is running:**
   ```bash
   # Windows PowerShell
   Get-Process python | Where-Object {$_.Path -like "*python*"}
   ```

2. **Stop any running Django servers:**
   - Press `Ctrl+C` in any terminal running `python manage.py runserver`
   - Close any Python processes related to Django

3. **Close database viewers:**
   - Close any SQLite database viewers (DB Browser, etc.)
   - Close any IDE database tools

### Step 2: Delete Locked Database Files

**Option A: Using File Explorer**
1. Navigate to `C:\carbon_footprint_tracker\`
2. Delete `db.sqlite3` if it exists
3. Delete `db.sqlite3-journal` if it exists
4. Empty the Recycle Bin

**Option B: Using PowerShell (Run as Administrator)**
```powershell
cd C:\carbon_footprint_tracker
Remove-Item db.sqlite3 -Force -ErrorAction SilentlyContinue
Remove-Item db.sqlite3-journal -Force -ErrorAction SilentlyContinue
```

### Step 3: Run Setup Commands

Once the database files are deleted, run these commands in order:

```bash
# 1. Run migrations (creates fresh database)
python manage.py migrate

# 2. Initialize categories
python manage.py init_categories

# OR use the complete setup script:
python setup_complete.py

# 3. Create superuser (optional, for admin access)
python manage.py createsuperuser

# 4. Start server
python manage.py runserver
```

## ✅ Automated Setup Script

I've created `setup_complete.py` which will:
- ✅ Initialize all categories (Food, Transport, Energy)
- ✅ Create a test user (username: `testuser`, password: `testpass123`)

**Run it after migrations:**
```bash
python setup_complete.py
```

## 🚀 Quick Setup (Once Database is Unlocked)

Run this single command to do everything:

```bash
python manage.py migrate && python manage.py init_categories && python setup_complete.py && python manage.py runserver
```

Or use the Windows batch file:
```bash
quickstart.bat
```

## 📝 What's Already Done

✅ Project structure created
✅ All models, views, templates created
✅ .env file created
✅ Static/media directories created
✅ URLs configured
✅ Admin interface set up

## 🎯 What You Need to Do

1. **Close any running Django/Python processes**
2. **Delete locked database files** (if they exist)
3. **Run migrations:** `python manage.py migrate`
4. **Initialize categories:** `python manage.py init_categories`
5. **Create superuser:** `python manage.py createsuperuser`
6. **Start server:** `python manage.py runserver`

## 🆘 Still Having Issues?

If the database is still locked:

1. **Restart your computer** (clears all file locks)
2. **Check antivirus** - may be scanning the database file
3. **Run as Administrator** - may need elevated permissions
4. **Use a different database** - edit `settings.py` to use PostgreSQL or MySQL

## 📞 Alternative: Use In-Memory Database (Temporary)

If you just want to test the app, you can temporarily use an in-memory database by editing `carbon_tracker/settings.py`:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # In-memory database
    }
}
```

**Note:** This will lose all data when the server stops, but it's good for testing!
