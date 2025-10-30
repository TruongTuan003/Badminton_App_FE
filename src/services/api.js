import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';


const API_URL = 'http://192.168.1.66:3000/api'; 



const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000, 
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  updateProfile: (userData) => api.post('/auth/update-profile', userData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, otp, newPassword) => api.post('/auth/reset-password', { email, otp, newPassword }),
};

export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (userData) => api.put('/user/profile', userData),
  completeProfile: (profileData) => api.post('/user/complete-profile', profileData),
};

export const workoutAPI = {
    getAll: () => api.get("/trainings"),
     getByGoal: (goal) => api.get(`/trainings/goal/${encodeURIComponent(goal)}`),
     getById: (id) => api.get(`/trainings/${id}`),
};

export default api;
