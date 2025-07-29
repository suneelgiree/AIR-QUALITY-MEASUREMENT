import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Search, Wind, Droplets, CloudRain, AlertTriangle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const Forecasting = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const [location, setLocation] = useState('Lalitpur'); // Default location
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherForecast, setWeatherForecast] = useState([]);
  const [aqiForecast, setAqiForecast] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const navigate = useNavigate();

  // --- User info for navbar ---
  const [userInfo, setUserInfo] = useState(null);
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserInfo(JSON.parse(storedUser));
    }
  }, []);
  const accountName = userInfo?.full_name || "User";
  // --- End user info ---

  // This function generates mock weather data when API calls fail
  const generateMockWeatherData = () => {
    const today = new Date();
    return Array(7).fill(0).map((_, i) => {
      const date = new Date();
      date.setDate(today.getDate() + i);
      return {
        temperature: 25 + Math.round(Math.random() * 10 - 5),
        date: date.toISOString(),
        precipitation_probability: Math.round(Math.random() * 100),
        wind_speed: 5 + Math.round(Math.random() * 10),
        humidity: 40 + Math.round(Math.random() * 40),
        condition: ["Clear", "Cloudy", "Rainy", "Sunny"][Math.floor(Math.random() * 4)],
        pressure: 1000 + Math.round(Math.random() * 30),
        confidence: 0.7 - (i * 0.05)
      };
    });
  };

  // This function generates hourly temperature data
  const generateHourlyChartData = (baseTemp) => {
    const hourlyData = [];
    const currentHour = new Date().getHours();

    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      let tempVariation = 0;

      if (hour >= 0 && hour < 6) {
        tempVariation = -2 - Math.random() * 2;
      } else if (hour >= 6 && hour < 12) {
        tempVariation = -2 + ((hour - 6) / 6) * 5 + (Math.random() * 1 - 0.5);
      } else if (hour >= 12 && hour < 18) {
        tempVariation = 3 - ((hour - 12) / 6) * 2 + (Math.random() * 1 - 0.5);
      } else {
        tempVariation = 1 - ((hour - 18) / 6) * 3 + (Math.random() * 1 - 0.5);
      }

      hourlyData.push({
        hour: `${hour}:00`,
        temp: Math.round((baseTemp + tempVariation) * 10) / 10
      });
    }

    return hourlyData;
  };

  // Main data fetching function
  const fetchForecastData = async (locationName) => {
    setIsLoading(true);
    setError(null);

    try {
      // Weather forecast
      let weatherData = [];
      try {
        const weatherResponse = await axios.get(`/api/weather/forecast/?location=${locationName}`);
        weatherData = weatherResponse.data;
      } catch (err) {
        weatherData = generateMockWeatherData();
      }

      // Current weather
      let currentWeatherData = null;
      try {
        const currentWeatherResponse = await axios.get(`/api/weather/current/?location=${locationName}`);
        currentWeatherData = currentWeatherResponse.data;
      } catch (err) {
        currentWeatherData = {
          main: { temp: 25, humidity: 50, pressure: 1013 },
          wind: { speed: 10 }
        };
      }

      // AQI data with predictions
      let aqiData = { predictions: [] };
      try {
        const token = localStorage.getItem('token') ||
          localStorage.getItem('authToken') ||
          localStorage.getItem('isAuthenticated');
        if (token) {
          const aqiResponse = await axios.get('/api/air-quality/sensor/update/', {
            headers: { Authorization: `Token ${token}` }
          });
          aqiData = aqiResponse.data;
        }
      } catch (err) {
        aqiData = {
          predictions: [
            { predicted_aqi_24h: 45, model_used: 'mock_model.pkl' },
            { predicted_aqi_24h: 48, model_used: 'alternate_model.pkl' }
          ]
        };
      }

      // Format weather forecast data
      const formattedWeatherForecast = weatherData.map(day => ({
        temp: Math.round(day.temperature),
        date: new Date(day.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long' }),
        day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
        rain: day.precipitation_probability || 0,
        wind: Math.round(day.wind_speed),
        humidity: day.humidity,
        condition: day.condition,
        pressure: day.pressure,
        confidence: day.confidence
      }));

      // Format AQI forecast data
      let formattedAqiForecast = [];
      if (aqiData && aqiData.predictions && aqiData.predictions.length > 0) {
        formattedAqiForecast = aqiData.predictions.map((prediction, index) => ({
          aqi: Math.round(prediction.predicted_aqi_24h),
          model: prediction.model_used,
          date: new Date(Date.now() + (24 + index * 24) * 60 * 60 * 1000).toLocaleDateString('en-US', { day: '2-digit', month: 'long' })
        }));
      }

      // Generate hourly chart data
      const baseTemp = currentWeatherData?.main?.temp || 25;
      const hourlyData = generateHourlyChartData(baseTemp);

      // Update state with formatted data
      setWeatherForecast(formattedWeatherForecast);
      setAqiForecast(formattedAqiForecast);
      setCurrentWeather(currentWeatherData);
      setChartData(hourlyData);

    } catch (error) {
      setError("Could not load complete forecast data. Some information may be estimated.");
      if (weatherForecast.length === 0) {
        const mockData = generateMockWeatherData();
        setWeatherForecast(mockData.map(day => ({
          temp: Math.round(day.temperature),
          date: new Date(day.date).toLocaleDateString('en-US', { day: '2-digit', month: 'long' }),
          day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
          rain: day.precipitation_probability || 0,
          wind: Math.round(day.wind_speed),
          humidity: day.humidity,
          condition: day.condition,
          pressure: day.pressure,
          confidence: day.confidence
        })));
      }
      if (chartData.length === 0) {
        setChartData(generateHourlyChartData(25));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data loading - load data when component mounts
  useEffect(() => {
    fetchForecastData(location);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(searchQuery);
      fetchForecastData(searchQuery);
    }
  };

  const handleDaySelect = (index) => {
    setSelectedDay(index);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Get AQI color based on value
  const getAqiColor = (aqi) => {
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-400';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-600';
    return 'bg-red-900';
  };

  // Get AQI category text
  const getAqiCategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
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
        <form onSubmit={handleSearch} className="flex items-center bg-green-100 rounded-full px-4 py-2 w-80 shadow-inner mx-6">
          <input
            type="text"
            placeholder="Search location..."
            className="bg-transparent outline-none flex-1 text-green-900 placeholder:text-green-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit">
            <Search className="w-5 h-5 text-green-400 hover:text-green-600 cursor-pointer" />
          </button>
        </form>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex justify-center items-center py-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Forecasting Content - Only show when we have data */}
      {weatherForecast.length > 0 && (
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
                      <div className="text-2xl font-bold text-blue-700">
                        {weatherForecast[0]?.date.split(' ')[0] || ''}
                      </div>
                      <div className="text-xs text-gray-500">
                        {weatherForecast[0]?.day + ',' || ''}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">
                        {weatherForecast[0]?.date.split(' ')[1] || ''}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 mb-1">
                        {weatherForecast[0]?.temp}°C
                      </div>
                      <div className="text-xs text-gray-500">
                        Rain: {weatherForecast[0]?.rain}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Wind: {weatherForecast[0]?.wind}km/h
                      </div>
                    </div>
                  </div>
                  <button
                    className="mt-4 w-full bg-gradient-to-r from-blue-400 to-green-600 text-white rounded-full py-1 font-semibold shadow hover:from-blue-500 hover:to-green-700 transition hover:scale-105"
                    onClick={() => handleDaySelect(0)}
                  >
                    Show Today's Forecast
                  </button>
                </div>

                {/* 7 Days Forecast */}
                <div className="bg-blue-100 rounded-2xl shadow p-4 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="font-semibold text-blue-800 mb-3">7 Days Forecast</div>
                  <div className="flex flex-col gap-3">
                    {weatherForecast.map((forecast, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between ${selectedDay === i ? 'bg-blue-50 scale-105' : 'bg-white'} rounded-xl px-3 py-2 shadow hover:bg-blue-50 hover:scale-[1.03] transition-all cursor-pointer`}
                        onClick={() => handleDaySelect(i)}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full ${selectedDay === i ? 'bg-blue-600' : 'bg-blue-700'} flex items-center justify-center text-white text-xs font-bold`}>
                            {forecast.temp}°
                          </div>
                          <span className="text-gray-700 text-sm">{forecast.date}</span>
                        </div>
                        <span className="text-gray-500 text-xs">{forecast.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AQI Forecast */}
                {aqiForecast.length > 0 && (
                  <div className="bg-blue-100 rounded-2xl shadow p-4 mt-6 hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="font-semibold text-blue-800 mb-3">AQI Prediction</div>
                    <div className="flex flex-col gap-3">
                      {aqiForecast.map((forecast, i) => (
                        <div key={i} className="bg-white rounded-xl px-3 py-2 shadow hover:bg-blue-50 hover:scale-[1.03] transition-all">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={`w-6 h-6 rounded-full ${getAqiColor(forecast.aqi)} flex items-center justify-center text-white text-xs font-bold`}>
                                {forecast.aqi}
                              </div>
                              <span className="text-gray-700 text-sm">{forecast.date}</span>
                            </div>
                            <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                              {getAqiCategory(forecast.aqi)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Predicted using {forecast.model.replace('_model.pkl', '')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Center: Forecast Card */}
              <div className="flex-1 flex flex-col gap-6">
                {/* Forecast Info Card */}
                <div className="bg-gradient-to-r from-blue-200 via-green-100 to-green-200 rounded-2xl shadow flex items-center px-8 py-6 gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-gray-700 text-sm mb-1">
                      {selectedDay === 0 ? "Today's Forecast" : `${weatherForecast[selectedDay]?.day}'s Forecast`}
                    </div>
                    <div className="text-4xl font-bold text-blue-600">
                      {weatherForecast[selectedDay]?.temp}°C
                    </div>
                    <div className="text-xs text-gray-600 flex items-center mt-1">
                      <Droplets className="w-3 h-3 mr-1" />
                      Rain: {weatherForecast[selectedDay]?.rain}%
                    </div>
                    <div className="text-xs text-gray-600 flex items-center">
                      <Wind className="w-3 h-3 mr-1" />
                      Wind: {weatherForecast[selectedDay]?.wind}km/h
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center mx-8">
                    <div className="text-gray-700 text-sm mb-1">Weather</div>
                    <span className="bg-blue-400 text-white px-3 py-1 rounded font-bold text-xs hover:bg-blue-500 transition">
                      {weatherForecast[selectedDay]?.condition || "Clear"}
                    </span>
                    <div className="mt-3 flex items-center gap-1">
                      {/* Temperature Color Bar */}
                      <div className="w-32 h-3 rounded bg-gradient-to-r from-blue-400 via-green-400 to-yellow-300 hover:scale-x-105 transition" />
                      <span className="text-xs text-gray-500 ml-2">{weatherForecast[selectedDay]?.temp}°C</span>
                    </div>
                    <div className="flex justify-between w-32 text-[10px] text-gray-500 mt-1">
                      <span>{Math.max(10, weatherForecast[selectedDay]?.temp - 10)}°C</span>
                      <span>{weatherForecast[selectedDay]?.temp}°C</span>
                      <span>{weatherForecast[selectedDay]?.temp + 5}°C</span>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-end justify-between h-full">
                    <div className="text-right">
                      <div className="font-semibold text-blue-900">{location}</div>
                      <div className="text-xs text-gray-700 flex items-center justify-end mt-1">
                        <CloudRain className="w-3 h-3 mr-1" />
                        Humidity: {weatherForecast[selectedDay]?.humidity || 0}%
                      </div>
                      <div className="text-xs text-gray-700 flex items-center justify-end">
                        Pressure: {weatherForecast[selectedDay]?.pressure || 0} hPa
                      </div>
                      <div className="text-xs text-gray-700 flex items-center justify-end">
                        Confidence: {Math.round((weatherForecast[selectedDay]?.confidence || 0) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>

                {/* Temperature Chart */}
                <div className="bg-blue-100 rounded-2xl shadow p-6 mt-2 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="font-semibold text-blue-800 mb-2">
                    {selectedDay === 0 ? "Today's" : `${weatherForecast[selectedDay]?.day}'s`} Temperature Levels
                  </div>
                  <div className="flex items-end gap-2 h-40">
                    {chartData.map((hour, i) => (
                      <div
                        key={i}
                        className="flex-1 flex flex-col items-center group"
                      >
                        <div
                          className="w-4 rounded-t bg-gradient-to-t from-blue-400 via-green-400 to-yellow-300 group-hover:scale-110 group-hover:shadow-lg transition-all"
                          style={{ height: `${(hour.temp - 10) * 6}px` }}
                          title={`Temp: ${hour.temp}°C`}
                        ></div>
                        <span className="text-[10px] text-gray-500 mt-1 group-hover:text-blue-700 transition">
                          {hour.hour}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* AQI and Weather Combined View */}
                {aqiForecast.length > 0 && (
                  <div className="bg-blue-100 rounded-2xl shadow p-6 mt-2 hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="font-semibold text-blue-800 mb-4">Weather & Air Quality Relationship</div>

                    <div className="flex space-x-6">
                      <div className="flex-1 bg-white p-4 rounded-xl shadow">
                        <div className="text-sm text-blue-900 font-medium mb-2">Temperature Impact on AQI</div>
                        <div className="flex items-center">
                          <div className="w-3 h-20 bg-gradient-to-b from-red-500 via-yellow-400 to-blue-500 rounded-full mr-2"></div>
                          <div className="text-xs text-gray-700 flex flex-col justify-between h-20">
                            <span>High Temp (30°C+): Increased ground-level ozone</span>
                            <span>Medium Temp (20-30°C): Moderate effect</span>
                            <span>Low Temp (&lt;20°C): Lower pollutant formation</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-1 bg-white p-4 rounded-xl shadow">
                        <div className="text-sm text-blue-900 font-medium mb-2">Humidity Impact on AQI</div>
                        <div className="flex items-center">
                          <div className="w-3 h-20 bg-gradient-to-b from-blue-500 to-blue-100 rounded-full mr-2"></div>
                          <div className="text-xs text-gray-700 flex flex-col justify-between h-20">
                            <span>High Humidity (70%+): Particulates absorb water</span>
                            <span>Medium Humidity (40-70%): Varying effects</span>
                            <span>Low Humidity (&lt;40%): Dry air can increase dust</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 bg-white p-4 rounded-xl shadow">
                      <div className="text-sm text-blue-900 font-medium mb-2">Predicted AQI: {aqiForecast[0]?.aqi || 'N/A'}</div>
                      <div className={`h-8 rounded-md overflow-hidden flex ${getAqiColor(aqiForecast[0]?.aqi)}`}>
                        <div className="bg-white bg-opacity-20 h-full flex items-center justify-center text-white text-xs font-bold px-2">
                          {getAqiCategory(aqiForecast[0]?.aqi)}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Good<br/>(0-50)</span>
                        <span>Moderate<br/>(51-100)</span>
                        <span>Unhealthy for Sensitive Groups<br/>(101-150)</span>
                        <span>Unhealthy<br/>(151-200)</span>
                        <span>Very Unhealthy<br/>(201+)</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasting;