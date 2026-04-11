@echo off
echo ========================================
echo Carbon Footprint Tracker - Reset & Setup
echo ========================================
echo.
echo [WARNING] This will DELETE all existing data!
echo Press Ctrl+C to cancel, or
pause

echo.
echo [1/6] Stopping any running Django servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *runserver*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/6] Deleting old database files...
if exist db.sqlite3 (
    del /F /Q db.sqlite3
    echo   ✅ Deleted db.sqlite3
) else (
    echo   → No db.sqlite3 found
)

if exist db.sqlite3-journal (
    del /F /Q db.sqlite3-journal
    echo   ✅ Deleted db.sqlite3-journal
)

echo.
echo [3/6] Running migrations...
python manage.py migrate
if errorlevel 1 (
    echo   ❌ Migrations failed!
    pause
    exit /b 1
)
echo   ✅ Migrations completed

echo.
echo [4/6] Initializing categories...
python manage.py init_categories
if errorlevel 1 (
    echo   ❌ Category initialization failed!
    pause
    exit /b 1
)
echo   ✅ Categories initialized

echo.
echo [5/6] Running complete setup...
python setup_complete.py
if errorlevel 1 (
    echo   ⚠️  Setup script had issues, but continuing...
)

echo.
echo [6/6] Creating new superuser...
echo.
echo Please enter details for your new admin account:
python manage.py createsuperuser

echo.
echo ========================================
echo ✅ Reset Complete!
echo ========================================
echo.
echo Your new admin account is ready!
echo.
echo Next steps:
echo 1. Start server: python manage.py runserver
echo 2. Login at: http://127.0.0.1:8000/admin
echo 3. Use the app at: http://127.0.0.1:8000
echo.
pause
