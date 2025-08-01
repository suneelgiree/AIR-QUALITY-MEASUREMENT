import React, { useState, useEffect, useMemo, memo } from 'react';
import { Bell, User, LogOut, Search, RefreshCw, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import airQualityService from '../services/api/airQuality';
import AirQualityCard from '../components/AirQualityCard';

// --- Helper Functions ---
const getAqiInfo = (aqi) => {
  if (aqi <= 50) return { label: 'Good', color: 'green', className: 'text-green-600', bgClass: 'bg-green-400' };
  if (aqi <= 100) return { label: 'Moderate', color: 'yellow', className: 'text-yellow-600', bgClass: 'bg-yellow-400' };
  if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'orange', className: 'text-orange-600', bgClass: 'bg-orange-400' };
  if (aqi <= 200) return { label: 'Unhealthy', color: 'red', className: 'text-red-600', bgClass: 'bg-red-500' };
  if (aqi <= 300) return { label: 'Very Unhealthy', color: 'purple', className: 'text-purple-600', bgClass: 'bg-purple-500' };
  return { label: 'Hazardous', color: 'rose', className: 'text-rose-700', bgClass: 'bg-rose-700' };
};

const isSensorDataValid = (data) => data && typeof data.aqi === 'number' && data.aqi > 0;
const extractAqi = (data) => data?.aqi ?? data?.overall_aqi ?? null;
const extractPm25 = (data) => data?.pm25 ?? data?.concentrations?.['PM2.5'] ?? 'N/A';
const extractLocation = (data) => data?.location ?? data?.device_location ?? 'Unknown';
const extractTimestamp = (data) => data?.timestamp ? new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

// --- Reusable Components ---

const SkeletonLoader = ({ className = 'h-4' }) => (
  <div className={`animate-pulse space-y-3 ${className}`}>
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
  </div>
);

const Tip = memo(({ color, text }) => {
  const colorMap = {
    green: { bg: 'bg-green-100', text: 'text-green-500' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-500' },
    red: { bg: 'bg-red-100', text: 'text-red-500' },
  };
  const { bg, text: txt } = colorMap[color] || colorMap.green;
  return (
    <div className="flex items-start">
      <div className={`${bg} p-1 rounded-full mr-3 mt-1`}>
        <AlertCircle className={`w-4 h-4 ${txt}`} />
      </div>
      <p className="text-gray-700 text-sm">{text}</p>
    </div>
  );
});

const StatCard = memo(({ title, tag, loading, children }) => (
  <div className="bg-white/90 rounded-2xl shadow p-6 hover:shadow-xl transition-all h-full">
    <div className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
      <span>{title}</span>
      {tag && <span className="ml-auto px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">{tag}</span>}
    </div>
    {loading ? <SkeletonLoader /> : children}
  </div>
));

const HistoryChart = memo(({ historyData }) => {
  if (!historyData || historyData.length === 0) return null;

  return (
    <div className="bg-white/90 rounded-2xl shadow p-6">
      <div className="font-semibold text-blue-800 mb-4">Today's AQI Levels</div>
      <div className="flex items-end gap-2 h-40 overflow-x-auto">
        {historyData.map((item, i) => {
          const barAqi = extractAqi(item);
          const barHeight = barAqi ? Math.max(20, barAqi / 2) : 0;
          const aqiInfo = getAqiInfo(barAqi);
          return (
            <div key={item.timestamp || i} className="flex-1 flex flex-col items-center group min-w-[2rem]">
              <div
                className={`w-4 rounded-t transition-all group-hover:scale-110 group-hover:shadow-lg ${aqiInfo.bgClass}`}
                style={{ height: `${barHeight}px` }}
                title={`AQI: ${barAqi}`}
              ></div>
              <span className="text-[10px] text-gray-500 mt-1">
                {extractTimestamp(item)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
});

const Dashboard = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const isLoggedIn = !!localStorage.getItem('access_token');

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await airQualityService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUserInfo(JSON.parse(storedUser));
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const accountName = userInfo?.full_name || 'User';

  const { displayData, liveAqi, next24hrPrediction, historyData } = useMemo(() => {
    const sensorData = dashboardData?.current?.sensor_data;
    const apiData = dashboardData?.current?.api_data;
    const displayData = isSensorDataValid(sensorData) ? sensorData : apiData ?? {};
    const liveAqi = extractAqi(displayData);
    const predictions = sensorData?.predictions || [];
    const next24hrPrediction = predictions.find(p => p.hours_ahead === 24);
    const historyData = dashboardData?.history?.sensor_data || [];
    return { displayData, liveAqi, next24hrPrediction, historyData };
  }, [dashboardData]);

  const aqiInfo = liveAqi ? getAqiInfo(liveAqi) : {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-green-50 to-green-200">
      <nav className="bg-white/80 shadow flex items-center justify-between px-6 py-4 sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center space-x-6">
          <Link to={isLoggedIn ? "/dashboard" : "/"} className="text-2xl font-bold text-blue-900 hover:text-green-600">BreathSafe</Link>
          <Link to="/aqi" className="text-blue-800 hover:text-green-600 font-medium">AQI</Link>
          <Link to="/forecasting" className="text-blue-800 hover:text-green-600 font-medium">Forecasting</Link>
        </div>
        <div className="flex items-center bg-blue-50 rounded-lg px-3 py-1 shadow-inner mx-6">
          <Search className="w-5 h-5 text-blue-400 mr-2" />
          <input type="text" placeholder="Search location..." className="bg-transparent outline-none text-blue-900" disabled />
        </div>
        <div className="flex items-center space-x-6 relative">
          <button className="p-2 rounded-full hover:bg-blue-100" title="Notifications"><Bell className="w-6 h-6 text-blue-800" /></button>
          <div className="relative">
            <button onClick={() => setAccountMenu(v => !v)} className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full hover:bg-blue-200">
              <User className="w-5 h-5 text-blue-800" />
              <span className="text-blue-900 font-medium">{accountName}</span>
            </button>
            {accountMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-xl z-50 py-2">
                <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Welcome, {accountName}!</h1>
            <p className="text-gray-600">Here is your current air quality dashboard.</p>
          </div>
          <button onClick={loadDashboardData} className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-all duration-300 transform hover:scale-105" disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Updating...' : 'Update Data'}
          </button>
        </div>

        {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg shadow-md mb-6">
                <p className="font-bold">An error occurred</p>
                <p>{error}</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-8 space-y-6">
            <AirQualityCard data={displayData} loading={loading} error={error} />
            <HistoryChart historyData={historyData} />
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-4 space-y-6">
            <StatCard title="24-Hour Forecast" tag="SVR Model" loading={loading}>
              {next24hrPrediction ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between"><span className="text-purple-700">Predicted AQI</span><span className={`font-bold ${getAqiInfo(next24hrPrediction.predicted_aqi).className}`}>{Math.round(next24hrPrediction.predicted_aqi)}</span></div>
                  <div className="flex items-center justify-between"><span className="text-purple-700">Category</span><span className="font-bold text-purple-500">{getAqiInfo(next24hrPrediction.predicted_aqi).label}</span></div>
                </div>
              ) : <p className="text-gray-500">No prediction available</p>}
            </StatCard>
            <div className="bg-white/90 rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Recommendations</h3>
              {loading ? <SkeletonLoader /> : liveAqi ? (
                <div className="space-y-4">
                  {liveAqi <= 50 && <Tip color="green" text="Air quality is good. It's a great day for outdoor activities!" />}
                  {liveAqi > 50 && liveAqi <= 100 && <Tip color="yellow" text="Sensitive individuals should consider limiting prolonged outdoor exertion." />}
                  {liveAqi > 100 && liveAqi <= 150 && <Tip color="orange" text="Children and older adults should limit outdoor exertion." />}
                  {liveAqi > 150 && <Tip color="red" text="Reduce time spent outdoors and consider wearing a mask." />}
                </div>
              ) : <p className="text-gray-500">No recommendations available</p>}
            </div>
             <div className="bg-white/90 rounded-2xl shadow p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">Health Tips</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>• Keep windows closed when air quality is poor.</p>
                <p>• Use air purifiers with HEPA filters indoors.</p>
                <p>• Stay hydrated to help your body filter toxins.</p>
                <p>• Check air quality before planning outdoor activities.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;