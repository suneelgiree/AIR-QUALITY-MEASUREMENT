import { useState } from 'react';
import { Bell, User, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();
  const accountName = "Laxman Khatri"; // Replace with real user data

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

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
      <div className="flex flex-col md:flex-row gap-8 items-start justify-center min-h-[80vh] px-4 py-8">
        {/* Left: Quick Stats */}
        <div className="bg-white/90 rounded-2xl shadow p-6 min-w-[260px] hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
          <div className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
            <span>Today's Overview</span>
            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">Live</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-blue-700">AQI</span>
              <span className="font-bold text-yellow-600">100</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Temperature</span>
              <span className="font-bold text-green-700">28°C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Humidity</span>
              <span className="font-bold text-blue-500">26%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-blue-700">Precipitation</span>
              <span className="font-bold text-blue-400">30%</span>
            </div>
          </div>
          <button className="mt-6 w-full bg-gradient-to-r from-blue-400 to-green-500 text-white rounded-full py-1 font-semibold shadow hover:from-blue-500 hover:to-green-600 transition hover:scale-105">
            Show Details
          </button>
        </div>
        {/* Center: Welcome and Chart */}
        <div className="flex-1 flex flex-col items-center">
          <div className="w-full bg-gradient-to-r from-blue-200 via-green-100 to-green-200 rounded-2xl shadow p-8 mb-6 flex flex-col items-center hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
            <h1 className="text-3xl md:text-4xl font-bold text-blue-900 mb-2 text-center">Welcome to your Dashboard!</h1>
            <p className="text-blue-700 text-center max-w-lg">
              Monitor real-time air quality, weather, and forecasts powered by IoT sensors and ML models. Use the quick links to explore AQI and weather forecasting in detail.
            </p>
          </div>
          {/* Simple AQI Bar Chart */}
          <div className="w-full max-w-xl bg-blue-50 rounded-2xl shadow p-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
            <div className="font-semibold text-blue-800 mb-2">Today’s AQI Levels</div>
            <div className="flex items-end gap-2 h-40">
              {[120, 150, 180, 200, 250, 220, 180, 160, 140, 130, 170, 210].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center group">
                  <div
                    className="w-4 rounded-t bg-gradient-to-t from-green-400 via-yellow-400 via-orange-400 to-red-500 group-hover:scale-110 group-hover:shadow-lg transition-all"
                    style={{ height: `${val / 3}px` }}
                    title={`AQI: ${val}`}
                  ></div>
                  <span className="text-[10px] text-gray-500 mt-1 group-hover:text-blue-700 transition">{i + 8}:00</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Right: Quick Links */}
        <div className="flex flex-col gap-4 min-w-[180px]">
          <Link to="/aqi" className="bg-blue-100 hover:bg-blue-200 rounded-xl px-4 py-3 shadow text-blue-900 font-semibold text-center transition-all">
            View AQI Details
          </Link>
          <Link to="/forecasting" className="bg-green-100 hover:bg-green-200 rounded-xl px-4 py-3 shadow text-green-900 font-semibold text-center transition-all">
            View Forecasting
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;