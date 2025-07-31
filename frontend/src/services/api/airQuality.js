import axios from './axios';

// Use the correct API base path for all air quality endpoints
const API_BASE = '/air-quality';

const airQualityService = {
  // Get dashboard data (recommended for main dashboard page)
  getDashboard: async () => {
    try {
      const response = await axios.get(`${API_BASE}/dashboard/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching air quality dashboard:', error);
      throw error;
    }
  },

  // Get sensor history data (for history charts)
  getSensorHistory: async () => {
    try {
      const response = await axios.get(`${API_BASE}/sensor/history/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor air quality history:', error);
      throw error;
    }
  },

  // Update current AQI from OpenWeatherMap API
  updateAirQuality: async () => {
    try {
      const response = await axios.post(`${API_BASE}/update/`);
      return response.data;
    } catch (error) {
      console.error('Error updating air quality data:', error);
      throw error;
    }
  },

  // Update sensor AQI and get predictions (SVR)
  updateSensor: async (opts = { use_api: true }) => {
    try {
      const response = await axios.post(`${API_BASE}/sensor/update/`, opts);
      return response.data;
    } catch (error) {
      console.error('Error updating sensor air quality data:', error);
      throw error;
    }
  },

  // Upload sensor file (JSON or CSV)
  uploadSensorFile: async (payload) => {
    try {
      const response = await axios.post(`${API_BASE}/sensor/upload/`, payload);
      return response.data;
    } catch (error) {
      console.error('Error uploading sensor file:', error);
      throw error;
    }
  },

  // Get AQILog history
  getAQILogHistory: async () => {
    try {
      const response = await axios.get(`${API_BASE}/aqilog/history/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching AQILog history:', error);
      throw error;
    }
  },
};

export default airQualityService;