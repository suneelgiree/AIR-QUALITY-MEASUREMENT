import apiClient from './axios';

const authService = {
  register: (userData) => 
    apiClient.post('/auth/register/', userData),
    
  login: (credentials) => 
    apiClient.post('/auth/login/', credentials),
    
  getProfile: () => 
    apiClient.get('/auth/profile/'),
    
  updateProfile: (profileData) => 
    apiClient.patch('/auth/profile/', profileData),
    
  refreshToken: (refreshToken) => 
    apiClient.post('/auth/token/refresh/', { refresh: refreshToken })
};

export default authService;