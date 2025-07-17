import apiClient from './axios';

const weatherService = {
  getCurrentWeather: () => 
    apiClient.get('/weather/current/'),
    
  getForecast: (days = 5) => 
    apiClient.post('/weather/forecast/', { days_ahead: days })
};

export default weatherService;