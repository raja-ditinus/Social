import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach user-id header for authenticated requests.
// The token is set via setAuthUserId() after login/register.
let authUserId: string | null = null;

export const setAuthUserId = (id: string | null) => {
  authUserId = id;
};

api.interceptors.request.use(config => {
  if (authUserId) {
    config.headers['x-user-id'] = authUserId;
  }
  return config;
});

export default api;
