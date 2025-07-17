import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AirQualityHistory = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
        <div className="h-64 bg-gray-100 rounded w-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading History</h3>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">No Historical Data</h3>
        <p className="text-gray-600">No air quality history is available yet.</p>
      </div>
    );
  }
  
  // Format data for chart
  const chartData = data.map(item => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    aqi: item.aqi,
    pm25: item.pm25,
  })).reverse();
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Air Quality History</h3>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={chartData}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="aqi" fill="#3b82f6" name="AQI" />
          <Bar dataKey="pm25" fill="#10b981" name="PM2.5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AirQualityHistory;