# Air Quality Measurement System

![AIR-QUALITY-MEASUREMENT](https://img.shields.io/badge/AIR--QUALITY--MEASUREMENT-v1.0-brightgreen)
![Django](https://img.shields.io/badge/Django-4.2-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![Machine Learning](https://img.shields.io/badge/ML-Enabled-orange)
![IoT](https://img.shields.io/badge/IoT-Ready-red)
![AWS](https://img.shields.io/badge/Cloud-AWS-yellow)

A comprehensive air quality monitoring system combining real-time sensor data, external API integration, and machine learning predictions to provide actionable air quality information.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technologies Used](#technologies-used)
- [Installation & Deployment](#installation--deployment)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Machine Learning Models](#machine-learning-models)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

**Air Quality Measurement System** is a full-stack IoT application for monitoring, analyzing, and forecasting air quality. It combines sensor data, weather APIs, and AI models to provide users with real-time and predictive air quality insights, personalized health tips, and historical data visualization.

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

### Cloud/Deployment
- AWS Elastic Beanstalk (backend)
- AWS S3 + CloudFront (frontend static hosting)
- AWS RDS (database, optional)

---

## 🚀 Installation & Deployment

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm 6+
- Git
- AWS account (for cloud deployment)

---

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

### AWS Cloud Deployment

#### **Backend (Elastic Beanstalk)**
1. Prepare `requirements.txt`, `Procfile`, `runtime.txt`.
2. Initialize EB:
   ```bash
   eb init -p python-3.11 air-quality-app
   eb create air-quality-env
   eb open
   ```
3. Set environment variables (SECRET_KEY, API keys) in AWS EB dashboard.
4. (Optional) Connect RDS PostgreSQL database.
5. Use S3 for static/media files (`django-storages`).

#### **Frontend (S3 + CloudFront)**
1. Build frontend:
   ```bash
   npm run build  # or vite build
   ```
2. Upload `/dist` (or `/build`) to S3 bucket (static website hosting enabled).
3. Set public read policy for S3 objects.
4. (Optional) Configure CloudFront for CDN and HTTPS.
5. Set API URL in `.env` to Elastic Beanstalk backend endpoint.

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

Developed by Suneel Giree, Slok Regmi, Laxman Khatri, Prajil Baral | © 2023-2025 AIR-QUALITY-MEASUREMENT
