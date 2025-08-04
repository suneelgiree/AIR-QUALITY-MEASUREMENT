import axios from 'axios';

// Create a new Axios instance with your API's base URL
const instance = axios.create({
  baseURL: 'http://localhost:8000', // Your Django API's base URL
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically add the JWT access token to every request if available
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;