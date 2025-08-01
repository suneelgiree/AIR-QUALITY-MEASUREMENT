import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Search, Wind, Droplets, CloudRain, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import airQualityService from '../services/api/airQuality';
import axios from 'axios';

const Forecasting = () => {
  const [accountMenu, setAccountMenu] = useState(false);
  const [location, setLocation] = useState(''); // Start with an empty location
  const [searchQuery, setSearchQuery] = useState('');
  const [combinedForecast, setCombinedForecast] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();

  // --- FIX: Fetch user's location on initial load ---
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUserInfo(JSON.parse(storedUser));

    const fetchUserLocationAndData = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            try {
              // Reverse geocode to get city name from coordinates
              const geoResponse = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
              const city = geoResponse.data.address.city || geoResponse.data.address.town || geoResponse.data.address.village || 'Lalitpur';
              setLocation(city);
              fetchForecastData(city);
            } catch (geoError) {
              console.error("Reverse geocoding failed. Falling back to default location.", geoError);
              setLocation('Lalitpur');
              fetchForecastData('Lalitpur');
            }
          },
          (geoError) => {
            // Handle user denying permission or other geolocation errors
            console.warn("Geolocation permission denied. Falling back to default location.", geoError.message);
            setLocation('Lalitpur');
            fetchForecastData('Lalitpur');
          }
        );
      } else {
        // Handle browsers that don't support geolocation
        console.warn("Geolocation is not supported by this browser. Falling back to default location.");
        setLocation('Lalitpur');
        fetchForecastData('Lalitpur');
      }
    };

    fetchUserLocationAndData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const accountName = userInfo?.full_name || "User";

  const generateMockWeatherData = (days = 7) => {
    const today = new Date();
    return Array(days).fill(0).map((_, i) => {
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
      };
    });
  };

  const generateHourlyChartData = (baseTemp) => {
    const hourlyData = [];
    const currentHour = new Date().getHours();
    for (let i = 0; i < 24; i++) {
      const hour = (currentHour + i) % 24;
      let tempVariation = 0;
      if (hour >= 0 && hour < 6) tempVariation = -2 - Math.random() * 2;
      else if (hour >= 6 && hour < 12) tempVariation = -2 + ((hour - 6) / 6) * 5 + (Math.random() * 1 - 0.5);
      else if (hour >= 12 && hour < 18) tempVariation = 3 - ((hour - 12) / 6) * 2 + (Math.random() * 1 - 0.5);
      else tempVariation = 1 - ((hour - 18) / 6) * 3 + (Math.random() * 1 - 0.5);
      hourlyData.push({ hour: `${hour}:00`, temp: Math.round((baseTemp + tempVariation) * 10) / 10 });
    }
    return hourlyData;
  };

  const fetchForecastData = async (locationName) => {
    setIsLoading(true);
    setError(null);

    try {
      let weatherData = [];
      try {
        const weatherResponse = await axios.get(`/api/weather/forecast/?location=${locationName}`);
        if (Array.isArray(weatherResponse.data)) {
          weatherData = weatherResponse.data;
        } else {
          console.warn("Weather API did not return an array. Using mock data.");
          weatherData = generateMockWeatherData(7);
        }
      } catch (err) {
        console.warn("Weather API call failed. Using mock data.", err);
        weatherData = generateMockWeatherData(7);
      }

      let aqiPredictions = [];
      try {
        const aqiResponse = await airQualityService.updateSensor({ use_api: true });
        if (aqiResponse && Array.isArray(aqiResponse.predictions)) {
          aqiPredictions = aqiResponse.predictions;
        }
      } catch (err) {
        console.error("AQI prediction API failed.", err);
      }
      
      if (!Array.isArray(weatherData)) {
          throw new TypeError("Processed weather data is not an array, cannot proceed.");
      }

      const combinedData = weatherData.map((weatherDay) => {
        const dayDate = new Date(weatherDay.date);
        const aqiPrediction = aqiPredictions.find(p => {
          const predictionDate = new Date();
          predictionDate.setHours(predictionDate.getHours() + p.hours_ahead);
          return predictionDate.getDate() === dayDate.getDate();
        });

        return {
          date: dayDate.toLocaleDateString('en-US', { day: '2-digit', month: 'long' }),
          day: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
          temp: Math.round(weatherDay.temperature),
          rain: weatherDay.precipitation_probability || 0,
          wind: Math.round(weatherDay.wind_speed),
          humidity: weatherDay.humidity,
          condition: weatherDay.condition,
          pressure: weatherDay.pressure,
          aqi: aqiPrediction ? Math.round(aqiPrediction.predicted_aqi) : null,
          model: aqiPrediction ? aqiPrediction.model_used : null,
        };
      });

      setCombinedForecast(combinedData);

      if (combinedData.length > 0) {
        const baseTemp = combinedData[0].temp;
        setChartData(generateHourlyChartData(baseTemp));
        setSelectedDayIndex(0); // Reset to the first day on new data fetch
      } else {
        setError("No forecast data could be loaded for the specified location.");
      }

    } catch (error) {
      console.error("Failed to load forecast data:", error);
      setError(`Could not load forecast data. ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(searchQuery);
      fetchForecastData(searchQuery);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const getAqiColor = (aqi) => {
    if (!aqi) return 'bg-gray-400';
    if (aqi <= 50) return 'bg-green-500';
    if (aqi <= 100) return 'bg-yellow-400';
    if (aqi <= 150) return 'bg-orange-500';
    if (aqi <= 200) return 'bg-red-500';
    if (aqi <= 300) return 'bg-purple-600';
    return 'bg-red-900';
  };

  const getAqiCategory = (aqi) => {
    if (!aqi) return 'N/A';
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  const selectedForecast = combinedForecast[selectedDayIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-blue-100">
      <nav className="bg-white/80 shadow flex items-center justify-between px-6 py-4 mb-6">
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-2xl font-bold text-blue-900 hover:text-green-600 transition-colors">DashBoard</Link>
          <Link to="/aqi" className="text-blue-800 hover:text-green-600 font-medium transition-colors">AQI</Link>
          <Link to="/forecasting" className="text-blue-800 hover:text-green-600 font-medium transition-colors">Forecasting</Link>
        </div>
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

      {isLoading && (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-4 text-blue-700">Detecting location and loading forecast...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="flex justify-center items-center py-4">
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {!isLoading && !error && combinedForecast.length > 0 && (
        <div className="flex justify-center items-start py-4">
          <div className="w-[1200px] bg-white/80 rounded-3xl shadow-xl p-8 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-blue-900">7-Day Forecast for {location}</h1>
              <button
                onClick={() => fetchForecastData(location)}
                className="flex items-center px-4 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="flex gap-6">
              <div className="w-72 flex-shrink-0">
                <div className="bg-blue-100 rounded-2xl shadow p-4 hover:shadow-lg hover:-translate-y-1 transition-all">
                  <div className="font-semibold text-blue-800 mb-3">7-Day Forecast</div>
                  <div className="flex flex-col gap-3">
                    {combinedForecast.map((forecast, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between ${selectedDayIndex === i ? 'bg-blue-50 scale-105' : 'bg-white'} rounded-xl px-3 py-2 shadow hover:bg-blue-50 hover:scale-[1.03] transition-all cursor-pointer`}
                        onClick={() => setSelectedDayIndex(i)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${selectedDayIndex === i ? 'bg-blue-600' : 'bg-blue-700'} flex items-center justify-center text-white text-sm font-bold`}>
                            {forecast.temp}°
                          </div>
                          <div>
                            <div className="text-gray-700 text-sm font-medium">{forecast.day}</div>
                            <div className="text-gray-500 text-xs">{forecast.date}</div>
                          </div>
                        </div>
                        <div className={`w-8 h-8 rounded-full ${getAqiColor(forecast.aqi)} flex items-center justify-center text-white text-xs font-bold`}>
                          {forecast.aqi || 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {selectedForecast && (
                <div className="flex-1 flex flex-col gap-6">
                  <div className="bg-gradient-to-r from-blue-200 via-green-100 to-green-200 rounded-2xl shadow flex items-center px-8 py-6 gap-8 hover:shadow-2xl hover:-translate-y-1 transition-all">
                    <div className="flex flex-col items-center justify-center">
                      <div className="text-gray-700 text-sm mb-1">{selectedForecast.day}'s Forecast</div>
                      <div className="text-4xl font-bold text-blue-600">{selectedForecast.temp}°C</div>
                      <div className="text-xs text-gray-600 flex items-center mt-1">
                        <Droplets className="w-3 h-3 mr-1" />
                        Rain: {selectedForecast.rain}%
                      </div>
                      <div className="text-xs text-gray-600 flex items-center">
                        <Wind className="w-3 h-3 mr-1" />
                        Wind: {selectedForecast.wind}km/h
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center mx-8">
                      <div className="text-gray-700 text-sm mb-1">Predicted AQI</div>
                      <div className={`text-4xl font-bold ${getAqiColor(selectedForecast.aqi).replace('bg-', 'text-')}`}>
                        {selectedForecast.aqi || 'N/A'}
                      </div>
                      <span className={`mt-1 ${getAqiColor(selectedForecast.aqi)} text-white px-3 py-1 rounded font-bold text-xs`}>
                        {getAqiCategory(selectedForecast.aqi)}
                      </span>
                    </div>

                    <div className="flex-1 flex flex-col items-end justify-between h-full">
                      <div className="text-right">
                        <div className="font-semibold text-blue-900">{location}</div>
                        <div className="text-xs text-gray-700 flex items-center justify-end mt-1">
                          <CloudRain className="w-3 h-3 mr-1" />
                          Humidity: {selectedForecast.humidity || 0}%
                        </div>
                        <div className="text-xs text-gray-700 flex items-center justify-end">
                          Pressure: {selectedForecast.pressure || 0} hPa
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-100 rounded-2xl shadow p-6 mt-2 hover:shadow-lg hover:-translate-y-1 transition-all">
                    <div className="font-semibold text-blue-800 mb-2">
                      {selectedForecast.day}'s Temperature Levels
                    </div>
                    <div className="flex items-end gap-2 h-40">
                      {chartData.map((hour, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center group">
                          <div
                            className="w-4 rounded-t bg-gradient-to-t from-blue-400 via-green-400 to-yellow-300 group-hover:scale-110 group-hover:shadow-lg transition-all"
                            style={{ height: `${Math.max(10, (hour.temp - 10) * 6)}px` }}
                            title={`Temp: ${hour.temp}°C`}
                          ></div>
                          <span className="text-[10px] text-gray-500 mt-1 group-hover:text-blue-700 transition">
                            {hour.hour}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Forecasting;