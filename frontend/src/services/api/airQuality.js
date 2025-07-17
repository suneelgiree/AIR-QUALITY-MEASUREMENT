import axios from './axios';

const airQualityService = {
  // Get current AQI data
  updateAirQuality: async () => {
    try {
      const response = await axios.post('/air-quality/update/');
      return response.data;
    } catch (error) {
      console.error('Error updating air quality data:', error);
      throw error;
    }
  },
  
  // Get historical AQI data
  getHistory: async () => {
    try {
      const response = await axios.get('/air-quality/history/');
      return response.data;
    } catch (error) {
      console.error('Error fetching air quality history:', error);
      throw error;
    }
  }
};

export default airQualityService;