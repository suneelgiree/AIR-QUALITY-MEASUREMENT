import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Search, MapPin, RefreshCw, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { airQualityService } from '../services/api';
import AirQualityCard from '../components/AirQualityCard';

const Dashboard = () => {
  // UI state
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();
  
  // Air quality state
  const [airQualityData, setAirQualityData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    // Get user info from localStorage
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }

    // Load initial data
    loadAirQualityData();
  }, []);

  const loadAirQualityData = async () => {
    setLoading(true);
    setError(null);

    try {
      // First try to get history, which should include latest reading
      const historyData = await airQualityService.getHistory();
      
      if (historyData && historyData.length > 0) {
        // Use the most recent record
        setAirQualityData(historyData[0]);
      } else {
        // If no history, update air quality
        const response = await airQualityService.updateAirQuality();
        setAirQualityData(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch air quality data:', err);
      setError(
        err.response?.data?.error || 
        'Unable to load air quality information. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateAirQuality = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await airQualityService.updateAirQuality();
      setAirQualityData(response.data);
    } catch (err) {
      console.error('Failed to update air quality:', err);
      setError(
        err.response?.data?.error || 
        'Unable to update air quality information. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  const accountName = userInfo?.full_name || "User";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-green-200">
      {/* Navbar */}
      <nav className="bg-white/80 shadow flex items-center justify-between px-6 py-4">
        {/* Left: Logo & Links */}
        <div className="flex items-center space-x-6">
          <Link to="/" className="text-2xl font-bold text-blue-900 hover:text-green-600 transition-colors">BreathSafe</Link>
          <Link to="/aqi" className="text-blue-800 hover:text-green-600 font-medium transition-colors">AQI</Link>
          <Link to="/forecasting" className="text-blue-800 hover:text-green-600 font-medium transition-colors">Forecasting</Link>
        </div>
        {/* Center: Search */}
        <div className="flex items-center bg-blue-50 rounded-lg px-3 py-1 shadow-inner mx-6">
          <Search className="w-5 h-5 text-blue-400 mr-2" />
          <input
            type="text"
            placeholder="Search location..."
            className="bg-transparent outline-none text-blue-900"
          />
        </div>
        {/* Right: Notification & Account */}
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
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50">
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
        {/* User Location */}
        {userInfo?.location && (
          <div className="mb-6 flex items-center text-blue-800">
            <MapPin className="w-5 h-5 mr-2" />
            <span className="font-medium">{userInfo.location}</span>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-200 via-green-100 to-green-200 rounded-2xl shadow p-6 mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Welcome to your Dashboard!</h1>
          <p className="text-blue-700 mt-2">
            Monitor real-time air quality and get personalized recommendations to stay healthy.
          </p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column: Quick Stats */}
          <div className="lg:col-span-3">
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
              ) : airQualityData ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">AQI</span>
                    <span 
                      className={`font-bold ${
                        airQualityData.aqi <= 50 ? 'text-green-600' : 
                        airQualityData.aqi <= 100 ? 'text-yellow-600' : 
                        airQualityData.aqi <= 150 ? 'text-orange-600' : 
                        'text-red-600'
                      }`}
                    >
                      {airQualityData.aqi}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">PM2.5</span>
                    <span className="font-bold text-blue-700">{airQualityData.pm25} μg/m³</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Location</span>
                    <span className="font-bold text-blue-500">{airQualityData.location}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700">Updated</span>
                    <span className="font-bold text-blue-400">
                      {new Date(airQualityData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
              
              <button 
                onClick={updateAirQuality}
                className="mt-6 w-full bg-gradient-to-r from-blue-400 to-green-500 text-white rounded-full py-1 font-semibold shadow hover:from-blue-500 hover:to-green-600 transition hover:scale-105 flex items-center justify-center"
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Update Data
              </button>
            </div>
          </div>

          {/* Center: Air Quality Card and Chart */}
          <div className="lg:col-span-6 space-y-6">
            {/* Air Quality Card */}
            <AirQualityCard 
              data={airQualityData} 
              loading={loading} 
              error={error} 
            />
            
            {/* AQI Chart */}
            {airQualityData && (
              <div className="bg-white/90 rounded-2xl shadow p-6">
                <div className="font-semibold text-blue-800 mb-4">Today's AQI Levels</div>
                <div className="flex items-end gap-2 h-40">
                  {[
                    airQualityData.aqi - 20, 
                    airQualityData.aqi - 10, 
                    airQualityData.aqi, 
                    airQualityData.aqi + 5, 
                    airQualityData.aqi + 10, 
                    airQualityData.aqi, 
                    airQualityData.aqi - 5
                  ].map((val, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group">
                      <div
                        className={`w-4 rounded-t transition-all group-hover:scale-110 group-hover:shadow-lg ${
                          val <= 50 ? 'bg-green-400' :
                          val <= 100 ? 'bg-yellow-400' :
                          val <= 150 ? 'bg-orange-400' :
                          'bg-red-500'
                        }`}
                        style={{ height: `${Math.max(20, val / 2)}px` }}
                        title={`AQI: ${val}`}
                      ></div>
                      <span className="text-[10px] text-gray-500 mt-1">{(new Date().getHours() + i - 3) % 24}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Recommendations and Health Tips */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recommendations */}
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
              ) : airQualityData ? (
                <div className="space-y-4">
                  {airQualityData.aqi <= 50 && (
                    <div className="flex items-start">
                      <div className="bg-green-100 p-1 rounded-full mr-2 mt-1">
                        <AlertCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-gray-700 text-sm">
                        Air quality is good. It's a great day for outdoor activities!
                      </p>
                    </div>
                  )}
                  
                  {airQualityData.aqi > 50 && airQualityData.aqi <= 100 && (
                    <div className="flex items-start">
                      <div className="bg-yellow-100 p-1 rounded-full mr-2 mt-1">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      </div>
                      <p className="text-gray-700 text-sm">
                        Air quality is moderate. Sensitive individuals should consider limiting prolonged outdoor exertion.
                      </p>
                    </div>
                  )}
                  
                  {airQualityData.aqi > 100 && airQualityData.aqi <= 150 && (
                    <div className="flex items-start">
                      <div className="bg-orange-100 p-1 rounded-full mr-2 mt-1">
                        <AlertCircle className="w-4 h-4 text-orange-500" />
                      </div>
                      <p className="text-gray-700 text-sm">
                        Air quality is unhealthy for sensitive groups. Children and older adults should limit outdoor exertion.
                      </p>
                    </div>
                  )}
                  
                  {airQualityData.aqi > 150 && (
                    <div className="flex items-start">
                      <div className="bg-red-100 p-1 rounded-full mr-2 mt-1">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      </div>
                      <p className="text-gray-700 text-sm">
                        Air quality is unhealthy. Reduce time spent outdoors and consider wearing a mask when outside.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">No recommendations available</p>
              )}
              
              {/* Quick Links */}
              <div className="flex flex-col gap-3 mt-6">
                <Link to="/aqi" className="bg-blue-100 hover:bg-blue-200 rounded-xl px-4 py-2 shadow text-blue-900 font-medium text-center transition-all">
                  View AQI Details
                </Link>
                <Link to="/forecasting" className="bg-green-100 hover:bg-green-200 rounded-xl px-4 py-2 shadow text-green-900 font-medium text-center transition-all">
                  View Forecasting
                </Link>
              </div>
            </div>
            
            {/* Health Tips */}
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

export default Dashboard;