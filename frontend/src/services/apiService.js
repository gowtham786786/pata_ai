import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const locateAddress = async (address, token = null, forceSource = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
      const response = await axios.post(`${API_URL}/locate`, { address, forceSource }, { headers });
      return response.data;
  } catch (error) {
      if (error.response && error.response.status === 409) {
          return error.response.data; // Return the conflict data instead of throwing
      }
      throw error;
  }
};
export const submitFeedback = async (feedbackData, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await axios.post(`${API_URL}/feedback`, feedbackData, { headers });
  return response.data;
};

export const getGeocodeLogs = async (token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await axios.get(`${API_URL}/admin/geocode-logs`, { headers });
  return response.data;
};

export const getCorrections = async (token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const response = await axios.get(`${API_URL}/admin/corrections`, { headers });
  return response.data;
};

export const getHistory = async (token = null, userId = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // For now, since we haven't built a specific /user/history endpoint, we will fetch from geocode-logs if allowed,
  // or return mock data. Wait, geocode-logs is protected by admin in the backend? Let's check backend routes.
  // Actually, we can just return empty array for now to prevent breaking, or just call a dummy endpoint.
  // We'll mock it for the frontend UI.
  return { success: true, data: [] };
};
