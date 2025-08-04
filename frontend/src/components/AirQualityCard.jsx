import React, { useMemo } from 'react';

// Helper function to determine AQI category and styling
const getAqiInfo = (aqi) => {
    if (aqi === null || typeof aqi === 'undefined') return { label: 'N/A', color: 'gray' };
    if (aqi <= 50) return { label: 'Good', color: 'green' };
    if (aqi <= 100) return { label: 'Moderate', color: 'yellow' };
    if (aqi <= 150) return { label: 'Unhealthy for Sensitive', color: 'orange' };
    if (aqi <= 200) return { label: 'Unhealthy', color: 'red' };
    if (aqi <= 300) return { label: 'Very Unhealthy', color: 'purple' };
    return { label: 'Hazardous', color: 'rose' };
};

const formatTimeAgo = (dateString) => {
    if (!dateString) return 'a moment ago';
  
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds} seconds ago`;
    
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
    const days = Math.round(hours / 24);
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const AirQualityCard = ({ data, loading, error }) => {
    const aqiValue = data?.overall_aqi ?? data?.aqi;
    const aqiInfo = useMemo(() => getAqiInfo(aqiValue), [aqiValue]);
    
    if (loading) {
        return (
            <div className="bg-white/90 rounded-2xl shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white/90 rounded-2xl shadow p-6 text-red-600">
                <h3 className="font-semibold">Could not load Air Quality</h3>
                <p>{error}</p>
            </div>
        );
    }

    if (!data) return null;

    const colorMap = {
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
        green: { bg: 'bg-green-100', text: 'text-green-800' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-800' },
        red: { bg: 'bg-red-100', text: 'text-red-800' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-800' },
        rose: { bg: 'bg-rose-100', text: 'text-rose-800' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-800' },
    };

    const badgeStyle = colorMap[aqiInfo.color];
    const pm25Value = data.pm25 ?? data.concentrations?.['PM2.5'];

    return (
        <div className="bg-white/90 rounded-2xl shadow p-6 transition-all">
            <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>Air Quality Index</span>
            </h3>
            <div className="space-y-4">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold inline-block ${badgeStyle.bg} ${badgeStyle.text}`}>
                    AQI: {aqiValue} - {aqiInfo.label}
                </div>
                <div>
                    <span className="text-gray-500 text-sm">PM2.5</span>
                    {/* FIX: Safely access .toFixed to prevent crash if pm25Value is not a number */}
                    <p className="text-3xl font-bold text-gray-800">{typeof pm25Value === 'number' ? pm25Value.toFixed(2) : 'N/A'} µg/m³</p>
                </div>
                <p className="text-gray-600 text-sm">
                    {
                        aqiValue <= 50 ? "Air quality is considered satisfactory, and air pollution poses little or no risk." :
                        aqiValue <= 100 ? "Air quality is acceptable; however, some pollutants may be a moderate health concern for a very small number of people who are unusually sensitive to air pollution." :
                        "Sensitive groups may experience more serious health effects. The general public is not likely to be affected."
                    }
                </p>
                <div className="border-t border-gray-200 pt-4 flex justify-between text-xs text-gray-500">
                    <span>Location: {data.location_name}</span>
                    <span>Updated: {formatTimeAgo(data.timestamp)}</span>
                </div>
            </div>
        </div>
    );
};

export default AirQualityCard;