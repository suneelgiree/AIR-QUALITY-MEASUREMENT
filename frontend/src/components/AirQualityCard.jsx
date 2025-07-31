import React from 'react';
import { Wind, AlertTriangle } from 'lucide-react';

const getAqiColor = (aqi) => {
  if (aqi <= 50) return 'bg-green-100 text-green-800 border-green-200';
  if (aqi <= 100) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  if (aqi <= 150) return 'bg-orange-100 text-orange-800 border-orange-200';
  if (aqi <= 200) return 'bg-red-100 text-red-800 border-red-200';
  if (aqi <= 300) return 'bg-purple-100 text-purple-800 border-purple-200';
  return 'bg-rose-100 text-rose-800 border-rose-200';
};

const getAqiLabel = (aqi) => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

const getHealthImplications = (aqi) => {
  if (aqi <= 50) return 'Air quality is satisfactory, and air pollution poses little or no risk.';
  if (aqi <= 100) return 'Air quality is acceptable. However, some pollutants may be a concern for a small number of people who are unusually sensitive.';
  if (aqi <= 150) return 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.';
  if (aqi <= 200) return 'Some members of the general public may experience health effects; sensitive groups may experience more serious health effects.';
  if (aqi <= 300) return 'Health alert: The risk of health effects is increased for everyone.';
  return 'Health warning of emergency conditions: everyone is more likely to be affected.';
};

const AirQualityCard = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl shadow-md border border-red-100">
        <div className="flex items-center mb-4">
          <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
          <h3 className="text-lg font-semibold text-red-800">Unable to load air quality data</h3>
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Data Available</h3>
        <p className="text-gray-600">Air quality data is currently unavailable for this location.</p>
      </div>
    );
  }

  // Defensive: Support both AirQualityRecord and AQILog formats (backend returns either)
  const aqi = typeof data.aqi === "number" ? data.aqi : (
    typeof data.overall_aqi === "number" ? data.overall_aqi : null
  );
  const pm25 = typeof data.pm25 !== "undefined"
    ? data.pm25
    : (data.concentrations && data.concentrations["PM2.5"])
      ? data.concentrations["PM2.5"]
      : null;
  const location = data.location || data.device_location || "Unknown";
  const timestamp = data.timestamp || null;

  const aqiColor = getAqiColor(aqi);
  const aqiLabel = getAqiLabel(aqi);
  const healthImplications = getHealthImplications(aqi);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="flex items-center mb-4">
        <Wind className="w-6 h-6 text-blue-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Air Quality Index</h3>
      </div>

      <div className="mb-4">
        <div className={`inline-block px-3 py-1 rounded-full font-medium ${aqiColor}`}>
          AQI: {aqi !== null ? aqi : "--"} - {aqiLabel}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-sm text-gray-500">PM2.5</p>
        <p className="font-semibold">{pm25 !== null && pm25 !== undefined ? pm25 : "--"} μg/m³</p>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        <p>{healthImplications}</p>
      </div>

      {location && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Location: <span className="font-medium">{location}</span>
          </p>
        </div>
      )}

      {timestamp && (
        <div className="mt-2 text-xs text-gray-400">
          Updated: {new Date(timestamp).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default AirQualityCard;