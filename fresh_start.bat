@echo off
echo ========================================
echo FRESH START - Complete Reset
echo ========================================
echo.
echo This will DELETE all data and start fresh!
echo.
pause

echo.
echo [1/6] Stopping Django servers...
taskkill /F /IM python.exe /FI "WINDOWTITLE eq *runserver*" 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/6] Deleting database files...
if exist db.sqlite3 (
    del /F /Q db.sqlite3 2>nul
    echo   [OK] Deleted db.sqlite3
) else (
    echo   -> No db.sqlite3 found
)

if exist db.sqlite3-journal (
    del /F /Q db.sqlite3-journal 2>nul
    echo   [OK] Deleted db.sqlite3-journal
)

if exist db.sqlite3-wal (
    del /F /Q db.sqlite3-wal 2>nul
    echo   [OK] Deleted db.sqlite3-wal
)

if exist db.sqlite3-shm (
    del /F /Q db.sqlite3-shm 2>nul
    echo   [OK] Deleted db.sqlite3-shm
)

echo.
echo [3/6] Running fresh migrations...
python manage.py migrate
if errorlevel 1 (
    echo   [ERROR] Migrations failed!
    echo.
    echo   If database is locked, please:
    echo   1. Close all Python/Django processes
    echo   2. Close database viewers
    echo   3. Close your IDE
    echo   4. Run this script again
    pause
    exit /b 1
)
echo   [OK] Migrations completed

echo.
echo [4/6] Initializing categories...
python manage.py init_categories
echo   [OK] Categories initialized

echo.
echo [5/6] Creating admin user...
python create_new_admin.py
echo   [OK] Admin user created

echo.
echo [6/6] Setup complete!
echo.
echo ========================================
echo FRESH START COMPLETE!
echo ========================================
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Next steps:
echo   1. Start server: python manage.py runserver
echo   2. Login at: http://127.0.0.1:8000/admin
echo   3. Use app at: http://127.0.0.1:8000
echo.
pause
