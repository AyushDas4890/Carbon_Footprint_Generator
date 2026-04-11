@echo off
echo ========================================
echo Carbon Footprint Tracker - Auto Setup
echo ========================================
echo.

echo [INFO] This script will attempt to set up the project automatically.
echo [INFO] If database is locked, you may need to close other processes first.
echo.

pause

echo [1/5] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo [2/5] Installing/updating dependencies...
pip install -r requirements.txt

echo.
echo [3/5] Attempting to run migrations...
python manage.py migrate
if errorlevel 1 (
    echo.
    echo [WARNING] Migrations failed - database may be locked!
    echo [WARNING] Please close any running Django servers or database viewers.
    echo [WARNING] Then delete db.sqlite3 and db.sqlite3-journal files.
    echo [WARNING] See SETUP_INSTRUCTIONS.md for troubleshooting.
    pause
    exit /b 1
)

echo.
echo [4/5] Initializing categories...
python manage.py init_categories

echo.
echo [5/5] Running complete setup script...
python setup_complete.py

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Create superuser: python manage.py createsuperuser
echo 2. Start server: python manage.py runserver
echo 3. Visit: http://127.0.0.1:8000
echo.
pause
