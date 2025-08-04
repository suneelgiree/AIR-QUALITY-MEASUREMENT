import apiClient from './axios';

const airQualityService = {
  // Fetches the latest "live" reading from the external proxy
  getLiveAqiFromProxy: async () => {
    try {
      const response = await apiClient.get('/api/air-quality/external/aqi-proxy/');
      return response.data;
    } catch (error) {
      console.error('Error fetching live AQI from proxy:', error);
      return null;
    }
  },

  // Fetches the user's sensor history
  getSensorHistory: async () => {
    try {
      const response = await apiClient.get('/api/air-quality/history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching sensor history:', error);
      throw error;
    }
  },

  // Fetches the latest forecast
  getForecast: async () => {
    try {
      const response = await apiClient.get('/api/air-quality/forecast/latest/');
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast:', error);
      throw error;
    }
  }
};

export default airQualityService;