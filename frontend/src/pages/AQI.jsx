import React, { useState } from 'react';
import { Bell, User, LogOut, Search } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const mockForecast = [
  { temp: 27, date: '09 January', day: 'Tuesday', aqi: 20 },
  { temp: 27, date: '10 January', day: 'Wednesday', aqi: 30 },
  { temp: 28, date: '11 January', day: 'Thursday', aqi: 25 },
  { temp: 29, date: '12 January', day: 'Friday', aqi: 40 },
];

const mockChart = [
  120, 150, 180, 200, 250, 300, 220, 180, 160, 140, 130, 170, 210, 230, 180, 150, 120, 100, 90, 110, 130, 160, 180, 200
];

const AQI = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const navigate = useNavigate();
  const accountName = "Laxman Khatri"; // Replace with real user data

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/');
  };

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
        <div className="w-[1200px] bg-white/80 rounded-3xl shadow-xl p-8 flex flex-col gap-6">
          {/* Top Row */}
          <div className="flex gap-6">
            {/* Left: AQI Navigator */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-2xl shadow p-4 mb-6 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="text-gray-500 text-sm mb-2">AQI Navigator</div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-bold text-green-700">20</div>
                    <div className="text-xs text-gray-500">Monday,</div>
                    <div className="text-lg font-semibold text-gray-800">January</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-700 mb-1">26°C</div>
                    <div className="text-xs text-gray-500">Wind Speed: 26km/h, E</div>
                    <div className="text-xs text-gray-500">Humidity: 20%</div>
                    <div className="text-xs text-gray-500">Precipitation: 20%</div>
                  </div>
                </div>
                <button className="mt-4 w-full bg-gradient-to-r from-green-400 to-green-600 text-white rounded-full py-1 font-semibold shadow hover:from-green-500 hover:to-green-700 transition hover:scale-105">
                  Show Today's Weather
                </button>
              </div>
              {/* 7 Days Forecast */}
              <div className="bg-green-100 rounded-2xl shadow p-4 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="font-semibold text-green-800 mb-3">7 Days Forecast</div>
                <div className="flex flex-col gap-3">
                  {mockForecast.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white rounded-xl px-3 py-2 shadow hover:bg-green-50 hover:scale-[1.03] transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold">
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
            {/* Center: AQI Card */}
            <div className="flex-1 flex flex-col gap-6">
              {/* AQI Info Card */}
              <div className="bg-gradient-to-r from-green-200 via-yellow-100 to-yellow-200 rounded-2xl shadow flex items-center px-8 py-6 gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center">
                  <div className="text-gray-700 text-sm mb-1">Live AQI</div>
                  <div className="text-4xl font-bold text-yellow-600">100</div>
                  <div className="text-xs text-gray-600">PM-10: 88 μg/m³</div>
                  <div className="text-xs text-gray-600">PM-2.5: 88 μg/m³</div>
                </div>
                <div className="flex flex-col items-center justify-center mx-8">
                  <div className="text-gray-700 text-sm mb-1">Air Quality</div>
                  <span className="bg-yellow-400 text-white px-3 py-1 rounded font-bold text-xs hover:bg-yellow-500 transition">MODERATE</span>
                  <div className="mt-3 flex items-center gap-1">
                    {/* AQI Color Bar */}
                    <div className="w-32 h-3 rounded bg-gradient-to-r from-green-400 via-yellow-400 via-orange-400 via-red-500 to-purple-700 hover:scale-x-105 transition" />
                    <span className="text-xs text-gray-500 ml-2">100</span>
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
                    <div className="font-semibold text-green-900">Patan, Lalitpur</div>
                    <div className="text-xs text-gray-700">Temperature: 28°C</div>
                    <div className="text-xs text-gray-700">Humidity: 26%</div>
                    <div className="text-xs text-gray-700">Precipitation: 30%</div>
                  </div>
                  {/* You can add an illustration or icon here */}
                </div>
              </div>
              {/* AQI Chart */}
              <div className="bg-green-100 rounded-2xl shadow p-6 mt-2 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer">
                <div className="font-semibold text-green-800 mb-2">Today’s AQI Levels</div>
                <div className="flex items-end gap-2 h-40">
                  {mockChart.map((val, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center group"
                    >
                      <div
                        className="w-4 rounded-t bg-gradient-to-t from-green-400 via-yellow-400 via-orange-400 to-red-500 group-hover:scale-110 group-hover:shadow-lg transition-all"
                        style={{ height: `${val / 3}px` }}
                        title={`AQI: ${val}`}
                      ></div>
                      <span className="text-[10px] text-gray-500 mt-1 group-hover:text-green-700 transition">{i + 1}:00</span>
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
}
export default AQI;