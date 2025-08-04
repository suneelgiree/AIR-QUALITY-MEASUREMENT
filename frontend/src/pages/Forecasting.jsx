import React, { useState, useEffect, useMemo } from 'react';
import { Bell, User, LogOut, Search, Wind, Droplets, CloudRain, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

// --- API Configuration ---
// 1. CORRECTED: Use the endpoint that provides the 7-day forecast, not the historical log.
const AQI_FORECAST_API_URL = 'http://127.0.0.1:8000/api/air-quality/forecast/latest/';

// 2. OpenWeatherMap endpoint for the REAL weather forecast
const OPENWEATHERMAP_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';

// 3. Your OpenWeatherMap API Key
const OPENWEATHERMAP_API_KEY = '259d54f384e54108346d8d5c0020c62d';

const Forecasting = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const [locationName, setLocationName] = useState('Loading...');
  const [combinedForecast, setCombinedForecast] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // --- Data Processing Function ---
  const processAndCombineData = (aqiForecastData, weatherData) => {
    // Group weather data by day, taking the first entry for each day as representative
    const dailyWeatherData = {};
    weatherData.list.forEach(item => {
      const dateKey = item.dt_txt.split(' ')[0]; // e.g., "2025-08-02"
      if (!dailyWeatherData[dateKey]) {
        dailyWeatherData[dateKey] = item;
      }
    });

    // Create a Map of AQI data for fast, accurate lookups by date
    const aqiDataMap = new Map();
    if (aqiForecastData && aqiForecastData.data_points) {
        aqiForecastData.data_points.forEach(item => {
            // Key: "2025-08-02", Value: { date: "2025-08-02", predicted_aqi: 74.4... }
            aqiDataMap.set(item.date, item);
        });
    }

    const weatherForecastDays = Object.values(dailyWeatherData).slice(0, 7);

    const combined = weatherForecastDays.map(weatherDay => {
      const weatherDateKey = weatherDay.dt_txt.split(' ')[0];
      const aqiDay = aqiDataMap.get(weatherDateKey); // Find the matching AQI data for this specific date

      const date = new Date(weatherDay.dt * 1000);
      
      return {
        date: date.toLocaleDateString('en-US', { day: '2-digit', month: 'long' }),
        day: date.toLocaleDateString('en-US', { weekday: 'long' }),
        temp: Math.round(weatherDay.main.temp),
        rain: Math.round((weatherDay.pop || 0) * 100),
        wind: Math.round(weatherDay.wind.speed * 3.6), // m/s to km/h
        humidity: weatherDay.main.humidity,
        pressure: weatherDay.main.pressure,
        aqi: aqiDay ? Math.round(aqiDay.predicted_aqi) : null, // Use the matched AQI value
        model: aqiForecastData.model_name,
      };
    });
    
    return combined;
  };
  
  const generateHourlyChartData = (baseTemp) => {
    return Array.from({ length: 24 }, (_, i) => {
        const hour = i;
        let tempVariation = 0;
        if (hour >= 0 && hour < 6) tempVariation = -3 - Math.random();
        else if (hour >= 6 && hour < 14) tempVariation = -3 + ((hour - 6) / 8) * 8 + (Math.random() * 2 - 1);
        else if (hour >= 14 && hour < 20) tempVariation = 5 - ((hour - 14) / 6) * 6 + (Math.random() * 2 - 1);
        else tempVariation = -1 - ((hour - 20) / 4) * 4 + Math.random();
        return { hour: `${hour}:00`, temp: Math.round((baseTemp + tempVariation)) };
    });
  };

  const fetchAllData = async (latitude, longitude) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the correct forecast endpoint
      const aqiPromise = fetch(AQI_FORECAST_API_URL, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.ok ? res.json() : Promise.reject('AQI forecast failed'));
      
      const weatherPromise = fetch(`${OPENWEATHERMAP_API_URL}?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHERMAP_API_KEY}&units=metric`)
        .then(res => res.ok ? res.json() : Promise.reject('Weather forecast failed'));

      const [aqiResult, weatherResult] = await Promise.all([aqiPromise, weatherPromise]);
      
      setLocationName(weatherResult.city.name || 'Your Location');
      const combined = processAndCombineData(aqiResult, weatherResult);
      setCombinedForecast(combined);

      if (combined.length > 0) {
        setChartData(generateHourlyChartData(combined[0].temp));
        setSelectedDayIndex(0);
      } else {
        setError("No forecast data could be loaded.");
      }

    } catch (err) {
      console.error("Failed to load forecast data:", err);
      setError(`Could not load forecast data. ${typeof err === 'string' ? err : 'Please check your connection and API key.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUserInfo(JSON.parse(storedUser));
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchAllData(latitude, longitude);
      },
      (geoError) => {
        console.warn("Geolocation failed, using default coordinates.", geoError.message);
        // Fallback to coordinates for Lalitpur, Nepal
        fetchAllData(27.68, 85.32); 
      }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
      if(combinedForecast.length > 0) {
          const selectedDayTemp = combinedForecast[selectedDayIndex].temp;
          setChartData(generateHourlyChartData(selectedDayTemp));
      }
  }, [selectedDayIndex, combinedForecast]);

  const handleLogout = () => { localStorage.clear(); navigate('/'); };
  const getAqiInfo = (aqi) => {
    if (aqi === null || aqi === undefined) return { color: 'bg-gray-400', textColor: 'text-gray-800', category: 'N/A' };
    if (aqi <= 50) return { color: 'bg-green-500', textColor: 'text-green-600', category: 'Good' };
    if (aqi <= 100) return { color: 'bg-yellow-400', textColor: 'text-yellow-600', category: 'Moderate' };
    if (aqi <= 150) return { color: 'bg-orange-500', textColor: 'text-orange-600', category: 'Unhealthy for Sensitive' };
    if (aqi <= 200) return { color: 'bg-red-500', textColor: 'text-red-600', category: 'Unhealthy' };
    if (aqi <= 300) return { color: 'bg-purple-600', textColor: 'text-purple-700', category: 'Very Unhealthy' };
    return { color: 'bg-rose-700', textColor: 'text-rose-800', category: 'Hazardous' };
  };

  const accountName = userInfo?.full_name || "User";
  const selectedForecast = combinedForecast[selectedDayIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <nav className="bg-white/80 shadow flex items-center justify-between px-6 py-4 mb-6"><div className="flex items-center space-x-6"><Link to="/dashboard" className="text-2xl font-bold text-blue-900 hover:text-green-600 transition-colors">DashBoard</Link><Link to="/aqi" className="text-blue-800 hover:text-green-600 font-medium transition-colors">AQI</Link><Link to="/forecasting" className="text-blue-800 hover:text-green-600 font-medium transition-colors">Forecasting</Link></div><div className="flex items-center bg-gray-100 rounded-full px-4 py-2 w-80 shadow-inner mx-6"><input type="text" placeholder="Search location..." className="bg-transparent outline-none flex-1 text-gray-500 placeholder:text-gray-400" disabled /><Search className="w-5 h-5 text-gray-400" /></div><div className="flex items-center space-x-6 relative"><button className="p-2 rounded-full hover:bg-blue-100 transition-colors" title="Notifications"><Bell className="w-6 h-6 text-blue-800" /></button><div className="relative"><button onClick={() => setAccountMenu(v => !v)} className="flex items-center space-x-2 px-3 py-1 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors"><User className="w-5 h-5 text-blue-800" /><span className="text-blue-900 font-medium">{accountName}</span></button>{accountMenu && (<div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-50"><button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-blue-50"><LogOut className="w-4 h-4 mr-2" /> Logout</button></div>)}</div></div></nav>
      <main className="flex justify-center items-start py-4">
        {isLoading ? (<div className="flex justify-center items-center py-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div><p className="ml-4 text-blue-700">Detecting location and loading forecasts...</p></div>)
        : error ? (<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center shadow-md"><AlertTriangle className="w-5 h-5 mr-2" /><span>{error}</span></div>)
        : combinedForecast.length > 0 && (
          <div className="w-[1200px] bg-white/80 rounded-3xl shadow-xl p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center"><h1 className="text-3xl font-bold text-blue-900">7-Day Forecast for {locationName}</h1><button onClick={() => window.location.reload()} className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors" disabled={isLoading}><RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh</button></div>
            <div className="flex gap-6">
              <div className="w-72 flex-shrink-0"><div className="bg-blue-100 rounded-2xl shadow p-4 hover:shadow-lg hover:-translate-y-1 transition-all"><div className="font-semibold text-blue-800 mb-3">7-Day Forecast</div><div className="flex flex-col gap-3">{combinedForecast.map((forecast, i) => (<div key={i} className={`flex items-center justify-between ${selectedDayIndex === i ? 'bg-blue-50 scale-105' : 'bg-white'} rounded-xl px-3 py-2 shadow hover:bg-blue-50 hover:scale-[1.03] transition-all cursor-pointer`} onClick={() => setSelectedDayIndex(i)}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full ${selectedDayIndex === i ? 'bg-blue-600' : 'bg-blue-700'} flex items-center justify-center text-white text-sm font-bold`}>{forecast.temp}°</div><div><div className="text-gray-700 text-sm font-medium">{forecast.day}</div><div className="text-gray-500 text-xs">{forecast.date}</div></div></div><div className={`w-8 h-8 rounded-full ${getAqiInfo(forecast.aqi).color} flex items-center justify-center text-white text-xs font-bold`}>{forecast.aqi ?? 'N/A'}</div></div>))}</div></div></div>
              {selectedForecast && (
                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-gradient-to-r from-blue-200 via-green-100 to-green-200 rounded-2xl shadow flex items-center px-8 py-6 gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all"><div className="flex flex-col items-center justify-center"><div className="text-gray-700 text-sm mb-1">{selectedForecast.day}'s Forecast</div><div className="text-4xl font-bold text-blue-600">{selectedForecast.temp}°C</div><div className="text-xs text-gray-600 flex items-center mt-1"><Droplets className="w-3 h-3 mr-1" />Rain: {selectedForecast.rain}%</div><div className="text-xs text-gray-600 flex items-center"><Wind className="w-3 h-3 mr-1" />Wind: {selectedForecast.wind}km/h</div></div><div className="flex flex-col items-center justify-center mx-8"><div className="text-gray-700 text-sm mb-1">Predicted AQI</div><div className={`text-4xl font-bold ${getAqiInfo(selectedForecast.aqi).textColor}`}>{selectedForecast.aqi ?? 'N/A'}</div><span className={`mt-1 ${getAqiInfo(selectedForecast.aqi).color} text-white px-3 py-1 rounded font-bold text-xs`}>{getAqiInfo(selectedForecast.aqi).category}</span></div><div className="flex-1 flex flex-col items-end justify-between h-full"><div className="text-right"><div className="font-semibold text-blue-900">{locationName}</div><div className="text-xs text-gray-700 flex items-center justify-end mt-1"><CloudRain className="w-3 h-3 mr-1" />Humidity: {selectedForecast.humidity}%</div><div className="text-xs text-gray-700 flex items-center justify-end">Pressure: {selectedForecast.pressure} hPa</div></div></div></div>
                  <div className="bg-blue-100 rounded-2xl shadow p-6 mt-2 hover:shadow-lg hover:-translate-y-1 transition-all"><div className="font-semibold text-blue-800 mb-2">{selectedForecast.day}'s Temperature Levels</div><div className="flex items-end gap-1 h-40">{chartData.map((hour, i) => (<div key={i} className="flex-1 flex flex-col items-center group"><div className="w-full rounded-t bg-gradient-to-t from-blue-400 via-green-400 to-yellow-300 group-hover:scale-110 group-hover:shadow-lg transition-all" style={{ height: `${Math.max(10, (hour.temp - 5) * 5)}px` }} title={`Temp: ${hour.temp}°C`}></div><span className="text-[10px] text-gray-500 mt-1 group-hover:text-blue-700 transition">{hour.hour}</span></div>))}</div></div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Forecasting;