import apiClient from './axios';

/**
 * Fetch the current user's profile from the backend.
 * Assumes a GET /api/auth/profile/ endpoint.
 */
const getProfile = async () => {
  const response = await apiClient.get('/auth/profile/');
  return response.data;
};

/**
 * Update the user's profile (optional, for editing).
 * Assumes a PATCH /api/auth/profile/ endpoint.
 */
const updateProfile = async (profileData) => {
  const response = await apiClient.patch('/auth/profile/', profileData);
  return response.data;
};

export default {
  getProfile,
  updateProfile,
};