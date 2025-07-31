import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import airQualityService from '../services/api/airQuality';
import AirQualityCard from '../components/AirQualityCard';

// Helper to decide if sensor AQI is valid
const isSensorAqiValid = (sensorData) =>
  typeof sensorData.aqi === "number" && sensorData.aqi > 10; // Use >10 as threshold for realistic values

// Defensive AQI extraction for live AQI
const extractAQI = (data) =>
  typeof data.aqi === "number" && data.aqi > 0
    ? data.aqi
    : typeof data.overall_aqi === "number" && data.overall_aqi > 0
      ? data.overall_aqi
      : null;

const getAqiCategory = (aqi) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const Dashboard = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isLoggedIn = Boolean(localStorage.getItem('access_token'));
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await airQualityService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        'Unable to load dashboard data. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const accountName = userInfo?.full_name || 'User';

  // Backend fields
  const sensorData = dashboardData?.current?.sensor_data || {};
  const apiData = dashboardData?.current?.api_data || {};

  // Use sensor data only if it's valid, otherwise fallback to api data
  const displayData = isSensorAqiValid(sensorData) ? sensorData : apiData;

  const liveAqi = extractAQI(displayData);

  // For prediction, use sensorData.predictions, fallback empty
  const predictions = sensorData?.predictions || [];
  const next24hrPrediction = predictions.find(p => p.hours_ahead === 24);

  // For history chart, use sensor history
  const historyData = dashboardData?.history?.sensor_data || [];

  const refreshAll = () => {
    loadDashboardData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-green-200">
      {/* Navbar */}
      <nav className="bg-white/80 shadow flex items-center justify-between px-6 py-4">
        <div className="flex items-center space-x-6">
          <Link
            to={isLoggedIn ? "/dashboard" : "/"}
            className="text-2xl font-bold text-blue-900 hover:text-green-600 transition-colors"
          >
            BreathSafe
          </Link>
          <Link to="/aqi" className="text-blue-800 hover:text-green-600 font-medium transition-colors">AQI</Link>
          <Link to="/forecasting" className="text-blue-800 hover:text-green-600 font-medium transition-colors">Forecasting</Link>
        </div>
        <div className="flex items-center bg-blue-50 rounded-lg px-3 py-1 shadow-inner mx-6">
          <Search className="w-5 h-5 text-blue-400 mr-2" />
          <input
            type="text"
            placeholder="Search location..."
            className="bg-transparent outline-none text-blue-900"
          />
        </div>
        <div className="flex items-center space-x-6 relative">
          <button className="p-2 rounded-full hover:bg-blue-100 transition-colors" title="Notifications">
            <Bell className="w-6 h-6 text-blue-800" />
          </button>
          <div className="relative">
            <button
              onClick={() => setAccountMenu((v) => !v)}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"
            >
              <User className="w-5 h-5 text-blue-800" />
              <span className="text-blue-900 font-medium">{accountName}</span>
            </button>
            {accountMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50 py-2">
                <Link
                  to="/profile"
                  className="flex items-center w-full px-4 py-2 text-blue-600 hover:bg-blue-50"
                  onClick={() => setAccountMenu(false)}
                >
                  <User className="w-4 h-4 mr-2" /> View Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-blue-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Today's Overview card */}
            <div className="bg-white/90 rounded-2xl shadow p-6 hover:shadow-xl transition-all h-full">
              <div className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <span>Today's Overview</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Live</span>
              </div>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-sm">{error}</div>
              ) : displayData && Object.keys(displayData).length ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">AQI</span>
                    <span className={`font-bold ${
                      liveAqi <= 50 ? 'text-green-600' :
                      liveAqi <= 100 ? 'text-yellow-600' :
                      liveAqi <= 150 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {liveAqi ?? "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">PM2.5</span>
                    <span className="font-bold text-blue-700">
                      {typeof displayData.pm25 !== "undefined"
                        ? displayData.pm25
                        : (displayData.concentrations && displayData.concentrations["PM2.5"])
                          ? displayData.concentrations["PM2.5"]
                          : "N/A"} μg/m³
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Location</span>
                    <span className="font-bold text-blue-500">{displayData.location || displayData.device_location || 'Unknown'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Updated</span>
                    <span className="font-bold text-blue-400">
                      {displayData.timestamp ? new Date(displayData.timestamp).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}

              <button
                onClick={refreshAll}
                className="mt-6 w-full bg-gradient-to-r from-blue-400 to-green-500 text-white rounded-full py-1 font-semibold shadow hover:from-blue-500 hover:to-green-600 transition hover:scale-105 flex items-center justify-center"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Update Data
              </button>
            </div>

            {/* SVR Predicted AQI card */}
            <div className="bg-white/90 rounded-2xl shadow p-6 mt-6 h-full">
              <div className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                <span>SVR Predicted AQI</span>
                <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded">Model</span>
              </div>
              {loading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : next24hrPrediction ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700">Predicted AQI</span>
                    <span className={`font-bold ${
                      next24hrPrediction.predicted_aqi <= 50 ? 'text-green-600' :
                      next24hrPrediction.predicted_aqi <= 100 ? 'text-yellow-600' :
                      next24hrPrediction.predicted_aqi <= 150 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {next24hrPrediction.predicted_aqi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-purple-700">Category</span>
                    <span className="font-bold text-purple-500">
                      {getAqiCategory(next24hrPrediction.predicted_aqi)}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No prediction available</p>
              )}
              <button
                onClick={refreshAll}
                className="mt-6 w-full bg-gradient-to-r from-purple-400 to-blue-500 text-white rounded-full py-1 font-semibold shadow hover:from-purple-500 hover:to-blue-600 transition hover:scale-105 flex items-center justify-center"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh Prediction
              </button>
            </div>
          </div>

          {/* Center Column */}
          <div className="lg:col-span-6 space-y-6">
            <AirQualityCard data={displayData} loading={loading} error={error} />
            {historyData.length > 0 && (
              <div className="bg-white/90 rounded-2xl shadow p-6">
                <div className="font-semibold text-blue-800 mb-4">Today's AQI Levels</div>
                <div className="flex items-end gap-2 h-40 overflow-x-auto">
                  {historyData.map((item, i) => {
                    const barAqi = extractAQI(item);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div
                          className={`w-4 rounded-t transition-all group-hover:scale-110 group-hover:shadow-lg ${
                            barAqi <= 50 ? 'bg-green-400' :
                            barAqi <= 100 ? 'bg-yellow-400' :
                            barAqi <= 150 ? 'bg-orange-400' :
                            'bg-red-500'
                          }`}
                          style={{ height: `${Math.max(20, barAqi / 2)}px` }}
                          title={`AQI: ${barAqi}`}
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-1">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white/90 rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Recommendations</h3>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              ) : error ? (
                <div className="text-red-600">Unable to provide recommendations</div>
              ) : displayData && Object.keys(displayData).length ? (
                <div className="space-y-4">
                  {liveAqi <= 50 && (
                    <Tip color="green" text="Air quality is good. It's a great day for outdoor activities!" />
                  )}
                  {liveAqi > 50 && liveAqi <= 100 && (
                    <Tip color="yellow" text="Air quality is moderate. Sensitive individuals should consider limiting prolonged outdoor exertion." />
                  )}
                  {liveAqi > 100 && liveAqi <= 150 && (
                    <Tip color="orange" text="Air quality is unhealthy for sensitive groups. Children and older adults should limit outdoor exertion." />
                  )}
                  {liveAqi > 150 && (
                    <Tip color="red" text="Air quality is unhealthy. Reduce time spent outdoors and consider wearing a mask when outside." />
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No recommendations available</p>
              )}

              <div className="flex flex-col gap-3 mt-6">
                <Link to="/aqi" className="bg-blue-100 hover:bg-blue-200 rounded-xl px-4 py-2 shadow text-blue-900 font-medium text-center transition-all">
                  View AQI Details
                </Link>
                <Link to="/forecasting" className="bg-green-100 hover:bg-green-200 rounded-xl px-4 py-2 shadow text-green-900 font-medium text-center transition-all">
                  View Forecasting
                </Link>
              </div>
            </div>

            <div className="bg-white/90 rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Health Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Keep windows closed when air quality is poor</p>
                <p>• Use air purifiers with HEPA filters indoors</p>
                <p>• Stay hydrated to help your body filter toxins</p>
                <p>• Check air quality before planning outdoor activities</p>
                <p>• Consider wearing a mask on high pollution days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Tip = ({ color, text }) => (
  <div className="flex items-start">
    <div className={`bg-${color}-100 p-1 rounded-full mr-2 mt-1`}>
      <AlertCircle className={`w-4 h-4 text-${color}-500`} />
    </div>
    <p className="text-gray-700 text-sm">{text}</p>
  </div>
);

export default Dashboard;