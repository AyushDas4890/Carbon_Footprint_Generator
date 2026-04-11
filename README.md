# Carbon Footprint Tracker 🌱

A Django-based web application to track and manage your carbon footprint. Log activities manually, get AI-powered insights, and visualize your environmental impact.

## Features

### Phase 1: Core Functionality ✅
- ✅ Manual activity logging with categories (Food, Transport, Energy)
- ✅ Activity history tracking with search and filters
- ✅ Dashboard with carbon impact summary
- ✅ User profiles with monthly goals and progress tracking
- ✅ Beautiful, modern UI with responsive design
- ✅ Image upload support for receipts

### Phase 2: AI Integration (Coming Soon)
- AI receipt scanner using OpenAI/Google Vision API
- Eco-chat assistant with context-aware advice
- Dynamic carbon scoring based on activity descriptions

### Phase 3: Visuals & Gamification (Coming Soon)
- Data visualization with Chart.js
- HTMX for seamless interactions
- Tailwind CSS styling with nature-themed colors

## Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)

### Step-by-Step Setup

1. **Clone or navigate to the project directory:**
```bash
cd carbon_footprint_tracker
```

2. **Create a virtual environment (recommended):**
```bash
python -m venv venv
```

3. **Activate the virtual environment:**
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

4. **Install dependencies:**
```bash
pip install -r requirements.txt
```

5. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env  # Windows
   cp .env.example .env    # Linux/Mac
   ```
   - Edit `.env` and set your `SECRET_KEY` (you can generate one using Django's `get_random_secret_key()`)

6. **Run migrations:**
```bash
python manage.py migrate
```

7. **Initialize default categories:**
```bash
python manage.py init_categories
```

8. **Create a superuser (admin account):**
```bash
python manage.py createsuperuser
```
Follow the prompts to create your admin account.

9. **Run the development server:**
```bash
python manage.py runserver
```

10. **Visit the application:**
   - Main app: `http://127.0.0.1:8000`
   - Admin panel: `http://127.0.0.1:8000/admin`

## Usage

### Getting Started

1. **Login:** Use the admin panel to login or create a new user account
2. **Set Your Goal:** Go to Profile and set your monthly carbon footprint goal
3. **Log Activities:** Click "Add Activity" to log your carbon footprint activities
4. **View Dashboard:** See your total carbon footprint, progress, and recent activities
5. **Check History:** View all logged activities with search and filter options

### Categories

The app comes with three default categories:
- **Food** 🍔 - Food and beverage consumption
- **Transport** 🚗 - Transportation and travel
- **Energy** ⚡ - Energy consumption (electricity, heating, etc.)

### Carbon Footprint Reference

Here are some common carbon footprint values to help you log activities:
- Car (gasoline): ~0.4 kg CO₂ per mile
- Flight: ~0.25 kg CO₂ per mile
- Beef burger: ~3.5 kg CO₂
- Electricity (US average): ~0.5 kg CO₂ per kWh
- Natural gas: ~0.2 kg CO₂ per kWh

## Project Structure

```
carbon_footprint_tracker/
├── tracker/              # Main Django app
│   ├── models.py        # Database models
│   ├── views.py         # View functions
│   ├── forms.py         # Django forms
│   ├── urls.py          # URL routing
│   ├── admin.py         # Admin configuration
│   ├── templates/       # HTML templates
│   └── management/      # Management commands
├── carbon_tracker/      # Django project settings
│   ├── settings.py     # Project settings
│   └── urls.py         # Root URL config
├── static/             # Static files (CSS, JS)
├── media/              # User uploaded files
├── manage.py           # Django management script
├── requirements.txt    # Python dependencies
└── README.md           # This file
```

## Development

### Running Tests
```bash
python manage.py test
```

### Creating Migrations
After modifying models:
```bash
python manage.py makemigrations
python manage.py migrate
```

### Accessing Admin Panel
Visit `http://127.0.0.1:8000/admin` and login with your superuser credentials.

## Contributing

This project is in active development. Check the project plan for upcoming features!

## License

This project is open source and available for educational purposes.

## Roadmap

- [x] Phase 1: Core CRUD functionality
- [ ] Phase 2: AI Integration (receipt scanner, eco-chat, dynamic scoring)
- [ ] Phase 3: Visuals & Gamification (Chart.js, HTMX, Tailwind CSS)
- [ ] Phase 4: Deployment & Documentation
