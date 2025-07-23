# Air Quality Measurement System

![AIR-QUALITY-MEASUREMENT](https://img.shields.io/badge/AIR--QUALITY--MEASUREMENT-v1.0-brightgreen)
![Django](https://img.shields.io/badge/Django-4.2-green)
![React](https://img.shields.io/badge/React-18.2-blue)
![Machine Learning](https://img.shields.io/badge/ML-Enabled-orange)
![IoT](https://img.shields.io/badge/IoT-Ready-red)

A comprehensive air quality monitoring system that combines real-time sensor data, external API integration, and machine learning predictions to provide accurate and actionable air quality information.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Machine Learning Models](#machine-learning-models)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

The Air Quality Measurement System is a full-stack IoT application that monitors, analyzes, and predicts air quality in real-time. It combines data from physical sensors and third-party APIs to provide comprehensive air quality assessments. The system calculates AQI (Air Quality Index) values following EPA standards and uses machine learning to predict future air quality conditions.

## ✨ Features

### 🔍 Air Quality Monitoring
- Real-time monitoring of air quality parameters (PM2.5, PM10, etc.)
- AQI calculation based on EPA standards
- Historical data tracking and visualization
- Geolocation-based air quality reporting

### 🌦️ Weather Integration
- Current weather conditions
- Weather forecasts for 7 days
- Weather parameter tracking (temperature, humidity, pressure)

### 📊 Data Visualization
- Interactive charts and graphs for air quality trends
- Color-coded AQI indicators
- Hourly and daily data visualization

### 🔮 Prediction & Analysis
- Machine learning models for AQI prediction
- 24-hour air quality forecasts
- Weather-AQI relationship analysis
- Confidence scores for predictions

### 📱 User Features
- User accounts and authentication
- Location-based personalization
- Real-time alerts and notifications
- Responsive design for mobile and desktop

## 🏗️ System Architecture

The system follows a modern three-tier architecture:

### Frontend (React)
- Dashboard for data visualization
- AQI monitoring interface
- Weather and AQI forecasting
- User authentication and profile management
- Multilingual support (English , Nepali and Hindi) using react-i18next
- Landing page with Navbar, Home, Services, About Us, and Footer

### Backend (Django)
- RESTful API endpoints
- Data processing and storage
- Authentication and authorization
- External API integration

### Data Collection
- IoT sensor integration (PMS7003, BME280)
- External API data sources (OpenWeatherMap)
- AQI calculation engine
- Machine learning prediction models

## 🛠️ Technologies Used

### Frontend
- React.js
- TailwindCSS
- Lucide React (icons)
- Axios (HTTP client)
- React Router

### Backend
- Django
- Django REST Framework
- NumPy & SciPy
- Scikit-learn (ML models)
- SQLite/PostgreSQL

### IoT & Data Collection
- Python
- PMS7003 sensor integration
- BME280 sensor integration
- EPA AQI calculation algorithms

## 📥 Installation

### Prerequisites
- Python 3.8+
- Node.js 14+
- npm 6+
- Git

### Backend Setup
```bash
# Clone the repository
git clone https://github.com/suneelgiree/AIR-QUALITY-MEASUREMENT.git
cd AIR-QUALITY-MEASUREMENT

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Start the Django server
python manage.py runserver
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ../frontend

# Install dependencies
npm install

# Start the development server
npm start
```

### Sensor Setup (Optional)
```bash
# Navigate to simulation directory
cd ../simulation

# Install requirements
pip install -r requirements.txt

# Run sensor simulation (if no physical sensors)
python simulate_sensors.py
```

## 📝 Usage

### Dashboard
The main dashboard provides an overview of current air quality, recent trends, and predictions:
1. Navigate to the dashboard after login
2. View current AQI and weather conditions
3. Check historical data trends
4. See predictions for upcoming air quality

### AQI Monitoring
The AQI page provides detailed air quality information:
1. Current AQI value and category
2. PM2.5 and PM10 concentrations
3. Health impact information
4. Historical AQI data chart

### Forecasting
The forecasting page combines weather and AQI predictions:
1. 7-day weather forecast
2. Temperature patterns throughout the day
3. AQI predictions for upcoming days
4. Weather-AQI relationship information

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/token/refresh/` - Refresh authentication token

### Air Quality Endpoints
- `GET /api/air-quality/update/` - Update air quality data from external API
- `GET /api/air-quality/history/` - Get air quality history
- `GET /api/air-quality/sensor/update/` - Update air quality using sensor data
- `GET /api/air-quality/sensor/history/` - Get sensor-based air quality history
- `GET /api/air-quality/dashboard/` - Get comprehensive dashboard data

### Weather Endpoints
- `GET /api/weather/current/` - Get current weather data
- `GET /api/weather/forecast/` - Get weather forecast

## 🧠 Machine Learning Models

The system includes several machine learning models for AQI prediction:

### Ridge Regression Model
- Features: Current AQI, PM2.5, PM10, temperature, humidity, pressure
- Target: AQI 24 hours ahead
- Performance: RMSE ~ 5-8 AQI points

### Random Forest Model
- Features: Current AQI, PM2.5, PM10, temperature, humidity, pressure, time of day, day of week
- Target: AQI 24 hours ahead
- Performance: RMSE ~ 4-7 AQI points

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Developed by Suneel Giree, Slok Regmi, Laxman Khatri, and Prajil Baral | © 2023-2025 AIR-QUALITY-MEASUREMENT
