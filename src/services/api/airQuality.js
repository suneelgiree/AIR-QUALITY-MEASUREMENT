import apiClient from './index';

const airQualityService = {
  updateAirQuality: () => 
    apiClient.post('/air-quality/update/'),
    
  getHistory: () => 
    apiClient.get('/air-quality/history/')
};

export default airQualityService;