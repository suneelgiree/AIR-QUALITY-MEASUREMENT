# Air Quality Measurement System

![AIR-QUALITY-MEASUREMENT](https://img.shields.io/badge/AIR--QUALITY--MEASUREMENT-v1.0-brightgreen)
![Django](https://img.shields.io/badge/Django-4.2-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![Machine Learning](https://img.shields.io/badge/ML-Enabled-orange)
![IoT](https://img.shields.io/badge/IoT-Ready-red)

A comprehensive air quality monitoring system combining real-time sensor data, external API integration, and machine learning predictions to provide actionable air quality information.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Viewing SQLite Data](#viewing-sqlite-data)
- [API Documentation](#api-documentation)
- [Machine Learning Models](#machine-learning-models)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**Air Quality Measurement System** is a full-stack IoT application for monitoring, analyzing, and forecasting air quality. It combines sensor data, weather APIs, and AI models to provide users with real-time and predictive insights.

---

## ✨ Features

### 🔍 Air Quality Monitoring
- Real-time AQI (Air Quality Index) monitoring (PM2.5, PM10, others)
- EPA-standard AQI calculation
- Historical and sensor-based AQI history
- Geolocation-based reports

### 🌦️ Weather Integration
- Current weather conditions
- 7-day weather forecast
- Hourly temperature charts

### 📊 Data Visualization
- Interactive charts (AQI, PM2.5, weather trends)
- Color-coded AQI indicators
- Hourly/daily data views

### 🔮 Prediction & Analysis
- ML-based AQI prediction (SVR, Ridge, Random Forest)
- 24-hour AQI forecasts
- Weather-AQI relationship charts
- Confidence scores on predictions

### 📱 User Features
- Registration, login, JWT authentication
- User profile management
- Location-based personalization
- Real-time alerts and notifications
- Responsive, multilingual UI (English, Nepali, Hindi)

---

## 🏗️ System Architecture

**Three-tier architecture:**

### Frontend (React)
- Dashboard, AQI, Forecasting, User Profile, Sensor History
- Interactive charts, health tips, recommendations
- Multilingual support (react-i18next)
- Responsive design (TailwindCSS)
- API communication via Axios

### Backend (Django + DRF)
- RESTful API endpoints for AQI, weather, sensors, user/profile
- JWT authentication
- Data storage, ML model integration

### Data Collection
- IoT sensors: PMS7003, BME280
- External APIs: OpenWeatherMap for weather
- AQI calculation and ML prediction engine

---

## 🛠️ Technologies Used

### Frontend
- React.js (Vite)
- TailwindCSS
- Lucide React (icons)
- Axios
- React Router
- i18next (multilingual)

### Backend
- Django
- Django REST Framework
- NumPy, SciPy
- Scikit-learn (ML)
- SQLite/PostgreSQL

### IoT & Data
- Python (sensor integration)
- PMS7003, BME280 sensors

---

## 🚀 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm 6+
- Git

### Local Setup

#### **Backend**
```bash
git clone https://github.com/suneelgiree/AIR-QUALITY-MEASUREMENT.git
cd AIR-QUALITY-MEASUREMENT/backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser  # optional
python manage.py runserver
```

#### **Frontend**
```bash
cd ../frontend
npm install
npm start
```

#### **Sensor Simulation (Optional)**
```bash
cd ../simulation
pip install -r requirements.txt
python simulate_sensors.py
```

---

## 🔎 Viewing SQLite Data

By default, the backend uses SQLite for local development. You can view and query the data stored in `db.sqlite3` using any of these methods:

### 1. Using the SQLite Command-Line
```bash
sqlite3 db.sqlite3
# In the SQLite shell:
.tables           # List all tables
SELECT * FROM <table_name>;  # Show table data
PRAGMA table_info(<table_name>);  # See columns of a table
.exit             # Exit the shell
```

### 2. Using DB Browser for SQLite (GUI)
- Download from [https://sqlitebrowser.org/](https://sqlitebrowser.org/)
- Open your `db.sqlite3` file and view/edit tables visually.

### 3. Using Django Admin Panel
- Run `python manage.py createsuperuser` (if not already)
- Run `python manage.py runserver`
- Visit `http://127.0.0.1:8000/admin` and log in.
- Browse and manage all registered models.

---

## 📝 Usage

### Dashboard
- Login > Dashboard shows current AQI, weather, trends, health tips

### AQI Page
- Detailed AQI value, PM2.5, PM10, health impacts, historical chart, sensor history

### Forecasting
- 7-day weather forecast, hourly temps, AQI predictions (ML models), weather-AQI relations

### Profile & Sensor History
- Manage user profile
- View sensor-based AQI history

---

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` — Login
- `POST /api/auth/register/` — Register
- `POST /api/auth/token/refresh/` — Refresh JWT token
- `GET /api/auth/profile/` — User profile

### Air Quality Endpoints
- `GET /api/air-quality/update/` — Update AQI from external API
- `GET /api/air-quality/history/` — AQI history
- `GET /api/air-quality/sensor/update/` — Update AQI from sensors (ML predicted AQI included)
- `GET /api/air-quality/sensor/history/` — Sensor AQI history
- `GET /api/air-quality/dashboard/` — Dashboard summary

### Weather Endpoints
- `GET /api/weather/current/` — Current weather
- `GET /api/weather/forecast/` — Weather forecast (7 days)

---

## 🧠 Machine Learning Models

- **SVR (Support Vector Regression):**  
  Predicts AQI for next 24 hours using current AQI, weather, and sensor data.
- **Ridge Regression, Random Forest:**  
  Used for comparative prediction and analysis.
- **Model workflow:**  
  Trained offline, loaded in backend, used in `/api/air-quality/sensor/update/`.
- **Prediction fields:**  
  `predicted_aqi_24h`, `model_used`, `confidence`

---

## 👥 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License - see LICENSE file for details.

---

Developed by Sunil Giri, Slok Regmi, Laxman Khatri, Prajil Baral | © 2023-2025 AIR-QUALITY-MEASUREMENT
