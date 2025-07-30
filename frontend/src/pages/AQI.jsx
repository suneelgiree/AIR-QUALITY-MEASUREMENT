import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Search, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import airQualityService from '../services/api/airQuality';

const AQI = () => {
  // UI state
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();

  // Data state
  const [airQualityData, setAirQualityData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // Predicted AQI state
  const [predictedAQI, setPredictedAQI] = useState(null);
  const [predictedLoading, setPredictedLoading] = useState(false);
  const [predictedError, setPredictedError] = useState(null);

  useEffect(() => {
    // Get user info from localStorage (same as Dashboard)
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }

    fetchAirQualityData();
    fetchHistoryData();
    fetchPredictedAQI();
  }, []);

  const fetchAirQualityData = async () => {
    setLoading(true);
    setError(null);

    try {
      // First check if we have history data
      const history = await airQualityService.getHistory();

      if (history && history.length > 0) {
        // Use the most recent record
        setAirQualityData(history[0]);
      } else {
        // No history data, try to update
        const response = await airQualityService.updateAirQuality();
        setAirQualityData(response);
      }
    } catch (err) {
      console.error('Error fetching air quality:', err);
      setError('Failed to load air quality data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryData = async () => {
    setHistoryLoading(true);
    setHistoryError(null);

    try {
      const history = await airQualityService.getHistory();
      setHistoryData(history);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryError('Failed to load air quality history.');
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPredictedAQI = async () => {
    setPredictedLoading(true);
    setPredictedError(null);
    try {
      const data = await airQualityService.getSVRPrediction();
      setPredictedAQI(data); // expects object: {aqi, pm25, pm10, category, temperature, ...}
    } catch (err) {
      setPredictedError(
        err?.response?.data?.error ||
        'Unable to load predicted AQI. Please try again later.'
      );
    } finally {
      setPredictedLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await airQualityService.updateAirQuality();
      setAirQualityData(response);

      // Refresh history data too
      fetchHistoryData();
      // Refresh predicted AQI too
      fetchPredictedAQI();
    } catch (err) {
      setError('Failed to update air quality data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getAqiLabel = (aqi) => {
    if (aqi <= 50) return { label: 'GOOD', color: 'bg-green-400 text-white' };
    if (aqi <= 100) return { label: 'MODERATE', color: 'bg-yellow-400 text-white' };
    if (aqi <= 150) return { label: 'UNHEALTHY FOR SENSITIVE GROUPS', color: 'bg-orange-400 text-white' };
    if (aqi <= 200) return { label: 'UNHEALTHY', color: 'bg-red-400 text-white' };
    if (aqi <= 300) return { label: 'VERY UNHEALTHY', color: 'bg-purple-500 text-white' };
    return { label: 'HAZARDOUS', color: 'bg-rose-800 text-white' };
  };

  const getChartData = () => {
    if (!historyData || historyData.length === 0) return [];
    // Convert history data to a format suitable for the chart
    return historyData.slice(0, 24).map(item => item.aqi).reverse();
  };

  const accountName = userInfo?.full_name || "User";
  const chartData = getChartData();
  const aqiStatus = airQualityData ? getAqiLabel(airQualityData.aqi) : { label: 'LOADING', color: 'bg-gray-400 text-white' };
  const predictedStatus = predictedAQI ? getAqiLabel(predictedAQI.aqi) : { label: 'PREDICTING', color: 'bg-gray-400 text-white' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-blue-50 to-green-200">
      {/* Dashboard Navbar with Search */}
      <nav className="bg-white/80 shadow flex items-center justify-between px-6 py-4 mb-6">
        {/* Left: Logo & Links */}
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-2xl font-bold text-blue-900 hover:text-green-600 transition-colors">DashBoard</Link>
          <Link to="/aqi" className="text-blue-800 hover:text-green-600 font-medium transition-colors">AQI</Link>
          <Link to="/forecasting" className="text-blue-800 hover:text-green-600 font-medium transition-colors">Forecasting</Link>
        </div>
        {/* Center: Search Bar */}
        <div className="flex items-center bg-green-100 rounded-full px-4 py-2 w-80 shadow-inner mx-6">
          <input
            type="text"
            placeholder="Search location..."
            className="bg-transparent outline-none flex-1 text-green-900 placeholder:text-green-400"
          />
          <Search className="w-5 h-5 text-green-400" />
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
      
      {/* Main AQI Content */}
      <div className="flex justify-center items-start py-4">
        <div className="w-full max-w-6xl bg-white/80 rounded-3xl shadow-xl p-8 flex flex-col gap-6">
          {/* Top Row - Header with Refresh Button */}
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-green-900">Air Quality Index</h1>
            <button 
              onClick={refreshData} 
              className="flex items-center px-4 py-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Update Data
            </button>
          </div>
          
          {/* Main Content */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: AQI Navigator */}
            <div className="w-full md:w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow p-4 mb-6 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="text-gray-500 text-sm mb-2">Current Location</div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-green-700">{airQualityData?.aqi || '—'}</div>
                    <div className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { weekday: 'long' })},</div>
                    <div className="text-lg font-semibold text-gray-800">{new Date().toLocaleDateString('en-US', { month: 'long' })}</div>
                  </div>
                  <div>
                    {airQualityData ? (
                      <>
                        <div className="text-sm text-gray-700 mb-1">PM2.5: {airQualityData.pm25} μg/m³</div>
                        <div className="text-xs text-gray-500">Location: {airQualityData.location}</div>
                        <div className="text-xs text-gray-500">Last updated: {new Date(airQualityData.timestamp).toLocaleTimeString()}</div>
                      </>
                    ) : loading ? (
                      <div className="text-sm text-gray-500">Loading data...</div>
                    ) : (
                      <div className="text-sm text-gray-500">No data available</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* AQI Understanding Card */}
              <div className="bg-green-100 rounded-2xl shadow p-4 hover:shadow-lg hover:-translate-y-1 transition-all">
                <div className="font-semibold text-green-800 mb-3">Understanding AQI</div>
                <div className="space-y-2">                
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                    <span className="text-xs text-gray-600">0-50: Good</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                    <span className="text-xs text-gray-600">51-100: Moderate</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-orange-500 mr-2"></div>
                    <span className="text-xs text-gray-600">101-150: Unhealthy for Sensitive Groups</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                    <span className="text-xs text-gray-600">151-200: Unhealthy</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                    <span className="text-xs text-gray-600">201-300: Very Unhealthy</span>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-rose-800 mr-2"></div>
                    <span className="text-xs text-gray-600">301+: Hazardous</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Center/Right: AQI Card, Predicted AQI, and Chart */}
            <div className="flex-1 flex flex-col gap-6">
              {/* AQI Info Card */}
              {loading ? (
                <div className="bg-gradient-to-r from-green-200 via-yellow-100 to-yellow-200 rounded-2xl shadow p-6 animate-pulse">
                  <div className="h-6 bg-white/30 rounded w-1/3 mb-4"></div>
                  <div className="h-10 bg-white/30 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-white/30 rounded w-1/2"></div>
                </div>
              ) : error ? (
                <div className="bg-red-100 rounded-2xl shadow p-6">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Data</h3>
                  <p className="text-red-600">{error}</p>
                  <button 
                    onClick={refreshData}
                    className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : airQualityData ? (
                <div className="bg-gradient-to-r from-green-200 via-yellow-100 to-yellow-200 rounded-2xl shadow flex items-center px-8 py-6 gap-8 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-700 text-sm mb-1">Live AQI</div>
                    <div className={`text-4xl font-bold ${
                      airQualityData.aqi <= 50 ? 'text-green-600' : 
                      airQualityData.aqi <= 100 ? 'text-yellow-600' :
                      airQualityData.aqi <= 150 ? 'text-orange-600' :
                      airQualityData.aqi <= 200 ? 'text-red-600' :
                      airQualityData.aqi <= 300 ? 'text-purple-700' : 
                      'text-rose-800'
                    }`}>{airQualityData.aqi}</div>
                    <div className="text-xs text-gray-600">PM-2.5: {airQualityData.pm25} μg/m³</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center mx-8">
                    <div className="text-gray-700 text-sm mb-1">Air Quality</div>
                    <span className={`${aqiStatus.color} px-3 py-1 rounded font-bold text-xs`}>
                      {aqiStatus.label}
                    </span>
                    <div className="mt-3 flex items-center gap-1">
                      {/* AQI Color Bar */}
                      <div className="w-32 h-3 rounded bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-red-500 to-purple-700" />
                      <span className="text-xs text-gray-500 ml-2">{airQualityData.aqi}</span>
                    </div>
                    <div className="flex justify-between w-32 text-[10px] text-gray-500 mt-1">
                      <span>0</span>
                      <span>50</span>
                      <span>100</span>
                      <span>150</span>
                      <span>200</span>
                      <span>300+</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 flex flex-col items-end justify-between h-full">
                    <div className="text-right">
                      <div className="font-semibold text-green-900">{airQualityData.location}</div>
                      <div className="text-xs text-gray-700">
                        Last Updated: {new Date(airQualityData.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-2xl shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
                  <p className="text-gray-600">Air quality data is not available. Click update to fetch the latest data.</p>
                </div>
              )}

              {/* Predicted AQI Card */}
              <div className="bg-purple-100 rounded-2xl shadow p-6 hover:shadow-lg mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg font-semibold text-purple-800">Predicted AQI (SVR Model)</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-200 text-purple-700">Next 24hr</span>
                </div>
                {predictedLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ) : predictedError ? (
                  <div className="text-red-500 text-sm">{predictedError}</div>
                ) : predictedAQI ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">AQI</span>
                      <span className={`font-bold ${predictedAQI.aqi <= 50 ? 'text-green-600' : predictedAQI.aqi <= 100 ? 'text-yellow-600' : predictedAQI.aqi <= 150 ? 'text-orange-600' : 'text-red-600'}`}>
                        {predictedAQI.aqi}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">PM2.5</span>
                      <span className="font-bold text-purple-500">{predictedAQI.pm25}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">PM10</span>
                      <span className="font-bold text-purple-500">{predictedAQI.pm10}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">Temperature</span>
                      <span className="font-bold text-purple-500">{predictedAQI.temperature}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-purple-700">Category</span>
                      <span className="font-bold text-purple-500">{predictedAQI.category}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-500">No prediction available</div>
                )}
                <button
                  onClick={fetchPredictedAQI}
                  className="mt-4 w-full bg-gradient-to-r from-purple-400 to-blue-500 text-white rounded-full py-1 font-semibold shadow hover:from-purple-500 hover:to-blue-600 transition hover:scale-105 flex items-center justify-center"
                  disabled={predictedLoading}
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${predictedLoading ? 'animate-spin' : ''}`} />
                  Refresh Prediction
                </button>
              </div>
              
              {/* Historical AQI Chart */}
              <div className="bg-green-100 rounded-2xl shadow p-6 hover:shadow-lg transition-all">
                <div className="font-semibold text-green-800 mb-2">AQI History</div>
                {historyLoading ? (
                  <div className="h-40 bg-white/30 rounded animate-pulse flex items-center justify-center">
                    <p className="text-green-800">Loading history data...</p>
                  </div>
                ) : historyError ? (
                  <div className="h-40 bg-red-50 rounded flex items-center justify-center">
                    <p className="text-red-600">{historyError}</p>
                  </div>
                ) : chartData.length > 0 ? (
                  <div className="flex items-end gap-2 h-40">
                    {chartData.map((val, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center group"
                      >
                        <div
                          className={`w-4 rounded-t ${
                            val <= 50 ? 'bg-green-400' : 
                            val <= 100 ? 'bg-yellow-400' :
                            val <= 150 ? 'bg-orange-400' :
                            val <= 200 ? 'bg-red-500' :
                            val <= 300 ? 'bg-purple-500' : 
                            'bg-rose-800'
                          } group-hover:scale-110 group-hover:shadow-lg transition-all`}
                          style={{ height: `${Math.max(20, val / 2)}px` }}
                          title={`AQI: ${val}`}
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-1 group-hover:text-green-700 transition">
                          {(new Date().getHours() - i) % 24 || 24}:00
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center">
                    <p className="text-gray-500">No historical data available</p>
                  </div>
                )}
              </div>
              
              {/* More Details Section */}
              <div className="bg-white rounded-2xl shadow p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Health Impact</h3>
                {loading ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                ) : error ? (
                  <div className="text-red-600">Unable to provide health impact information</div>
                ) : airQualityData ? (
                  <div className="space-y-4">
                    {airQualityData.aqi <= 50 && (
                      <p className="text-gray-700">
                        Air quality is considered satisfactory, and air pollution poses little or no risk.
                      </p>
                    )}
                    
                    {airQualityData.aqi > 50 && airQualityData.aqi <= 100 && (
                      <p className="text-gray-700">
                        Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution.
                      </p>
                    )}
                    
                    {airQualityData.aqi > 100 && airQualityData.aqi <= 150 && (
                      <p className="text-gray-700">
                        Members of sensitive groups may experience health effects. The general public is not likely to be affected.
                      </p>
                    )}
                    
                    {airQualityData.aqi > 150 && airQualityData.aqi <= 200 && (
                      <p className="text-gray-700">
                        Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.
                      </p>
                    )}
                    
                    {airQualityData.aqi > 200 && airQualityData.aqi <= 300 && (
                      <p className="text-gray-700">
                        Health warnings of emergency conditions. The entire population is more likely to be affected.
                      </p>
                    )}
                    
                    {airQualityData.aqi > 300 && (
                      <p className="text-gray-700">
                        Health alert: everyone may experience more serious health effects.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No health impact information available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AQI;