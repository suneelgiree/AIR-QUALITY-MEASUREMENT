import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Search, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import airQualityService from '../services/api/airQuality';

// --- FIX: More descriptive helper to provide all necessary classes ---
const getAqiInfo = (aqi) => {
  if (aqi <= 50) return { label: 'Good', cardBg: 'bg-green-50', textColor: 'text-green-600', badgeClasses: 'bg-green-100 text-green-800 border-green-200', historyBar: 'bg-green-400 hover:bg-green-500' };
  if (aqi <= 100) return { label: 'Moderate', cardBg: 'bg-yellow-50', textColor: 'text-yellow-600', badgeClasses: 'bg-yellow-100 text-yellow-800 border-yellow-200', historyBar: 'bg-yellow-400 hover:bg-yellow-500' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', cardBg: 'bg-orange-50', textColor: 'text-orange-600', badgeClasses: 'bg-orange-100 text-orange-800 border-orange-200', historyBar: 'bg-orange-400 hover:bg-orange-500' };
  if (aqi <= 200) return { label: 'Unhealthy', cardBg: 'bg-red-50', textColor: 'text-red-600', badgeClasses: 'bg-red-100 text-red-800 border-red-200', historyBar: 'bg-red-400 hover:bg-red-500' };
  if (aqi <= 300) return { label: 'Very Unhealthy', cardBg: 'bg-purple-50', textColor: 'text-purple-600', badgeClasses: 'bg-purple-100 text-purple-800 border-purple-200', historyBar: 'bg-purple-500 hover:bg-purple-600' };
  return { label: 'Hazardous', cardBg: 'bg-rose-50', textColor: 'text-rose-700', badgeClasses: 'bg-rose-100 text-rose-800 border-rose-200', historyBar: 'bg-rose-600 hover:bg-rose-700' };
};

const AQI = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();

  const [airQualityData, setAirQualityData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [historyError, setHistoryError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  const [predictedAQI, setPredictedAQI] = useState(null);
  const [predictedLoading, setPredictedLoading] = useState(false);
  const [disableUpdate, setDisableUpdate] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUserInfo(JSON.parse(storedUser));
    loadAllData();
    // eslint-disable-next-line
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setDisableUpdate(true);
    setError(null);
    setHistoryError(null);
    setPredictedLoading(true);

    try {
      const history = await airQualityService.getSensorHistory();
      let sensorHistory = [];
      if (Array.isArray(history)) sensorHistory = history;
      else if (history && typeof history === "object") 
        sensorHistory = history.sensor_history || history.aqilog_history || [];
      setHistoryData(sensorHistory);

      if (sensorHistory.length > 0) {
        setAirQualityData(sensorHistory[0]);
      } else {
        const response = await airQualityService.updateAirQuality();
        setAirQualityData(response);
      }

      const predictionResponse = await airQualityService.updateSensor({ use_api: true });
      const predictions = predictionResponse.predictions || [];
      const next24hr = predictions.find(p => p.hours_ahead === 24);
      setPredictedAQI(next24hr || null);

    } catch (err) {
      setError('Failed to load air quality data. Please try again.');
      setHistoryError('Failed to load air quality history.');
    } finally {
      setLoading(false);
      setDisableUpdate(false);
      setPredictedLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getChartData = () => {
    if (!Array.isArray(historyData) || historyData.length === 0) return [];
    return historyData
      .filter(item => (typeof item.aqi === "number" || typeof item.overall_aqi === "number") && item.timestamp)
      .slice(0, 10)
      .map(item => ({
        aqi: item.aqi ?? item.overall_aqi,
        timestamp: item.timestamp
      }))
      .reverse();
  };

  const accountName = userInfo?.full_name || "User";
  const chartData = getChartData();
  const currentAqiValue = airQualityData?.aqi ?? airQualityData?.overall_aqi;
  const aqiStatus = currentAqiValue ? getAqiInfo(currentAqiValue) : getAqiInfo(0);
  const shouldHideData = loading && !airQualityData;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-8">
          <Link to="/dashboard" className="text-xl font-bold text-blue-900">DashBoard</Link>
          <Link to="/aqi" className="text-gray-600 hover:text-blue-600 font-medium">AQI</Link>
          <Link to="/forecasting" className="text-gray-600 hover:text-blue-600 font-medium">Forecasting</Link>
        </div>
        <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-96">
          <input
            type="text"
            placeholder="Search location..."
            className="bg-transparent outline-none flex-1 text-gray-700"
            disabled
          />
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <div className="flex items-center space-x-6 relative">
          <button className="p-2 rounded-full hover:bg-gray-100"><Bell className="w-6 h-6 text-gray-700" /></button>
          <div className="relative">
            <button
              onClick={() => setAccountMenu((v) => !v)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
            >
              <User className="w-5 h-5 text-gray-700" />
              <span className="text-gray-800 font-medium">{accountName}</span>
            </button>
            {accountMenu && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-50">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Air Quality Index</h1>
            <button 
              onClick={loadAllData} 
              className="px-5 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition flex items-center"
              disabled={loading || disableUpdate}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Update Data
            </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
            <div className="col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-700 mb-4">Understanding AQI</h3>
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>Good</div><span>0-50</span></div>
                        <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-3"></div>Moderate</div><span>51-100</span></div>
                        <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-3"></div>Unhealthy for Sensitive</div><span>101-150</span></div>
                        <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-600 mr-3"></div>Unhealthy</div><span>151-200</span></div>
                        <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full bg-purple-600 mr-3"></div>Very Unhealthy</div><span>201-300</span></div>
                        <div className="flex items-center justify-between"><div className="flex items-center"><div className="w-3 h-3 rounded-full bg-rose-800 mr-3"></div>Hazardous</div><span>301+</span></div>
                    </div>
                </div>
            </div>

            <div className="col-span-6 space-y-6">
                {shouldHideData ? (
                    <div className="bg-white p-6 rounded-lg shadow-md animate-pulse h-60"></div>
                ) : error ? (
                     <div className="bg-red-50 p-6 rounded-lg shadow-md text-red-700">{error}</div>
                ) : airQualityData ? (
                    <div className={`${aqiStatus.cardBg} p-8 rounded-lg shadow-lg text-center`}>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-xl font-bold text-gray-800 text-left">{airQualityData.location ?? airQualityData.device_location ?? 'Unknown'}<br/><span className="text-sm font-normal text-gray-500">Live Air Quality Index</span></h2>
                            <span className={`border ${aqiStatus.badgeClasses} px-3 py-1 rounded-full text-sm font-semibold`}>{aqiStatus.label}</span>
                        </div>
                        <div className={`text-8xl font-bold ${aqiStatus.textColor} my-4`}>{currentAqiValue} <span className="text-4xl text-gray-600">US AQI</span></div>
                        <div className="flex justify-center gap-12 text-gray-600">
                            <span>PM2.5: <strong>{airQualityData.pm25 ?? airQualityData.concentrations?.['PM2.5'] ?? 'N/A'}</strong> µg/m³</span>
                            <span>PM10: <strong>{airQualityData.pm10 ?? airQualityData.concentrations?.['PM10'] ?? 'N/A'}</strong> µg/m³</span>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-6 rounded-lg shadow-md text-center text-gray-500">No data available.</div>
                )}
                
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-700 mb-4">AQI History (Last 10 readings)</h3>
                    {historyError ? (
                        <div className="h-48 flex items-center justify-center text-red-600">{historyError}</div>
                    ) : chartData.length > 0 ? (
                        <div className="flex items-end gap-1 h-48 border-b border-gray-200 pb-2">
                            {chartData.map((item, i) => {
                                const itemAqiInfo = getAqiInfo(item.aqi);
                                return (
                                    <div key={i} className="flex-1 flex flex-col items-center group h-full justify-end">
                                        <div
                                        className={`w-full rounded-t transition-all ${itemAqiInfo.historyBar}`}
                                        style={{ height: `${Math.max(5, (item.aqi / 300) * 100)}%` }}
                                        title={`AQI: ${item.aqi}`}
                                        ></div>
                                        <span className="text-[10px] text-gray-500 mt-2">
                                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-48 flex items-center justify-center text-gray-500">No historical data available.</div>
                    )}
                </div>
            </div>

            <div className="col-span-3 space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-700 mb-4">24-Hour Forecast</h3>
                    {predictedLoading ? (
                        <div className="animate-pulse"><div className="h-4 bg-gray-200 rounded w-3/4"></div><div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div></div>
                    ) : predictedAQI ? (
                        <div className="space-y-3">
                            <div className="flex justify-between items-baseline">
                                <span className="text-gray-600">Predicted AQI</span>
                                <span className="text-2xl font-bold text-gray-800">{Math.round(predictedAQI.predicted_aqi)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-600">Category</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getAqiInfo(Math.round(predictedAQI.predicted_aqi)).badgeClasses}`}>
                                    {getAqiInfo(Math.round(predictedAQI.predicted_aqi)).label}
                                </span>
                            </div>
                            <p className="text-xs text-gray-400 pt-2 border-t">Predicted using {predictedAQI.model_used}</p>
                        </div>
                    ) : (
                        <div className="text-gray-500">No prediction available.</div>
                    )}
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-gray-700 mb-2">Health Recommendations</h3>
                    <p className="text-gray-600">
                        {currentAqiValue > 150 ? "Everyone may begin to experience health effects. Reduce heavy exertion outdoors." : "Air quality is acceptable; however, for some pollutants there may be a moderate health concern for a very small number of people."}
                    </p>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

export default AQI;