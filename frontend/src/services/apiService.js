import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

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
  try {
    const response = await axios.get(`${API_URL}/history`, {
      headers,
      params: userId ? { userId } : {}
    });
    return response.data;
  } catch (error) {
    console.warn("Backend getHistory API notice:", error.response?.data || error.message);
    return { success: true, data: [] };
  }
};
