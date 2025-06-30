import React, { useState } from 'react';
import { Bell, User, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// Mock data for demonstration
const mockForecast = [
  { temp: 27, date: '09 January', day: 'Tuesday', rain: 10, wind: 12 },
  { temp: 28, date: '10 January', day: 'Wednesday', rain: 20, wind: 10 },
  { temp: 29, date: '11 January', day: 'Thursday', rain: 5, wind: 15 },
  { temp: 30, date: '12 January', day: 'Friday', rain: 0, wind: 8 },
  { temp: 28, date: '13 January', day: 'Saturday', rain: 15, wind: 11 },
  { temp: 27, date: '14 January', day: 'Sunday', rain: 12, wind: 9 },
  { temp: 26, date: '15 January', day: 'Monday', rain: 8, wind: 13 },
];

const mockChart = [
  25, 28, 30, 29, 27, 26, 28, 29, 30, 28, 27, 26, 25, 27, 28, 29, 30, 28, 27, 26, 25, 27, 28, 29
];

const Forecasting = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();
  const accountName = "Laxman Khatri"; // Replace with real user data

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      {/* Navbar */}
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
      {/* Main Forecasting Content */}
      <div className="flex justify-center items-start py-4">
        <div className="w-[1200px] bg-white/80 rounded-3xl shadow-xl p-8 flex flex-col gap-6">
          {/* Top Row */}
          <div className="flex gap-6">
            {/* Left: Weather Navigator */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow p-4 mb-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="text-gray-500 text-sm mb-2">Weather Navigator</div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-blue-700">09</div>
                    <div className="text-xs text-gray-500">Tuesday,</div>
                    <div className="text-lg font-semibold text-gray-800">January</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700 mb-1">27°C</div>
                    <div className="text-xs text-gray-500">Rain: 10%</div>
                    <div className="text-xs text-gray-500">Wind: 12km/h</div>
                  </div>
                </div>
                <button className="mt-4 w-full bg-gradient-to-r from-blue-400 to-green-600 text-white rounded-full py-1 font-semibold shadow hover:from-blue-500 hover:to-green-700 transition hover:scale-105">
                  Show Today's Forecast
                </button>
              </div>
              {/* 7 Days Forecast */}
              <div className="bg-blue-100 rounded-2xl shadow p-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="font-semibold text-blue-800 mb-3">7 Days Forecast</div>
                <div className="flex flex-col gap-3">
                  {mockForecast.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow hover:bg-blue-50 hover:scale-[1.03] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white text-xs font-bold">
                          {f.temp}°
                        </div>
                        <span className="text-gray-700 text-sm">{f.date}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{f.day}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Center: Forecast Card */}
            <div className="flex-1 flex flex-col gap-6">
              {/* Forecast Info Card */}
              <div className="bg-gradient-to-r from-blue-200 via-green-100 to-green-200 rounded-2xl shadow flex items-center px-8 py-6 gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-gray-700 text-sm mb-1">Today's Forecast</div>
                  <div className="text-4xl font-bold text-blue-600">27°C</div>
                  <div className="text-xs text-gray-600">Rain: 10%</div>
                  <div className="text-xs text-gray-600">Wind: 12km/h</div>
                </div>
                <div className="flex flex-col items-center justify-center mx-8">
                  <div className="text-gray-700 text-sm mb-1">Weather</div>
                  <span className="bg-blue-400 text-white px-3 py-1 rounded font-bold text-xs hover:bg-blue-500 transition">Clear</span>
                  <div className="mt-3 flex items-center gap-1">
                    {/* Temperature Color Bar */}
                    <div className="w-32 h-3 rounded bg-gradient-to-r from-blue-400 via-green-400 to-yellow-300 hover:scale-x-105 transition" />
                    <span className="text-xs text-gray-500 ml-2">27°C</span>
                  </div>
                  <div className="flex justify-between w-32 text-[10px] text-gray-500 mt-1">
                    <span>20°C</span>
                    <span>25°C</span>
                    <span>30°C</span>
                  </div>
                </div>
                <div className="flex-1 flex flex-col items-end justify-between h-full">
                  <div className="text-right">
                    <div className="font-semibold text-blue-900">Patan, Lalitpur</div>
                    <div className="text-xs text-gray-700">Rain: 10%</div>
                    <div className="text-xs text-gray-700">Wind: 12km/h</div>
                  </div>
                </div>
              </div>
              {/* Temperature Chart */}
              <div className="bg-blue-100 rounded-2xl shadow p-6 mt-2 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="font-semibold text-blue-800 mb-2">Today’s Temperature Levels</div>
                <div className="flex items-end gap-2 h-40">
                  {mockChart.map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div
                        className="w-4 rounded-t bg-gradient-to-t from-blue-400 via-green-400 to-yellow-300 group-hover:scale-110 group-hover:shadow-lg transition-all"
                        style={{ height: `${val * 3}px` }}
                        title={`Temp: ${val}°C`}
                      ></div>
                      <span className="text-[10px] text-gray-500 mt-1 group-hover:text-blue-700 transition">{i + 1}:00</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecasting;