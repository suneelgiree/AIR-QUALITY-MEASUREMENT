import apiClient from './axios';

const authService = {
  register: (userData) => 
    apiClient.post('/api/auth/register/', userData),
    
  login: (credentials) => 
    apiClient.post('/api/auth/login/', credentials),
    
  getProfile: () => 
    apiClient.get('/api/auth/profile/'),
    
  updateProfile: (profileData) => 
    apiClient.patch('/api/auth/profile/', profileData),
    
  refreshToken: (refreshToken) => 
    apiClient.post('/api/auth/login/refresh/', { refresh: refreshToken })
};

export default authService;