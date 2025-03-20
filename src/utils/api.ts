import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL, AUTH_TOKEN_KEY, AUTH_HEADER } from '../config';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization header
api.interceptors.request.use(
  (config) => {
    const storedUser = localStorage.getItem(AUTH_TOKEN_KEY);
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        if (userData.token) {
          config.headers[AUTH_HEADER] = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;
    
    // Handle authentication errors
    if (response && response.status === 401) {
      // Clear user data if unauthorized
      localStorage.removeItem(AUTH_TOKEN_KEY);
      // Redirect to login page if not already there
      if (window.location.pathname !== '/auth') {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/auth';
      }
    }
    
    // Handle server errors
    if (response && response.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    
    // Handle client errors
    if (response && response.status >= 400 && response.status < 500) {
      const errorMessage = response.data?.message || response.data?.error || 'Request failed';
      toast.error(errorMessage);
    }
    
    // Handle network errors
    if (!response) {
      toast.error('Network error. Please check your connection.');
    }
    
    return Promise.reject(error);
  }
);

// Generic GET request function
export const fetchData = async <T>(url: string): Promise<T> => {
  const response = await api.get<T>(url);
  return response.data;
};

// Define a type for request data to replace 'any'
export type RequestData = Record<string, unknown>;

// Generic POST request function
export const postData = async <T>(url: string, data: RequestData): Promise<T> => {
  const response = await api.post<T>(url, data);
  return response.data;
};

// Generic PUT request function
export const putData = async <T>(url: string, data: RequestData): Promise<T> => {
  const response = await api.put<T>(url, data);
  return response.data;
};

// Generic DELETE request function
export const deleteData = async <T>(url: string): Promise<T> => {
  const response = await api.delete<T>(url);
  return response.data;
};

export default api;
