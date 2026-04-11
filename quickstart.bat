@echo off
echo ========================================
echo Carbon Footprint Tracker - Quick Start
echo ========================================
echo.

echo [1/6] Checking Python installation...
python --version
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    pause
    exit /b 1
)

echo.
echo [2/6] Installing dependencies...
pip install -r requirements.txt

echo.
echo [3/6] Setting up environment...
if not exist .env (
    copy .env.example .env
    echo Created .env file. Please edit it with your SECRET_KEY.
)

echo.
echo [4/6] Running migrations...
python manage.py migrate

echo.
echo [5/6] Initializing categories...
python manage.py init_categories

echo.
echo [6/6] Setup complete!
echo.
echo Next steps:
echo 1. Create a superuser: python manage.py createsuperuser
echo 2. Run the server: python manage.py runserver
echo 3. Visit: http://127.0.0.1:8000
echo.
pause
