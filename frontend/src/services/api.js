import axios from 'axios';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
});

API.interceptors.request.use((config => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}));

API.interceptors.response.use(
  res => res,
  async error => {
    if (error.response?.status === 401) {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const signup = (username, password) => {
    return API.post('/signup/', { username, password });
};

export const createSession = (mode) => {
    return API.post('/session/create/', { mode });
};

export const uploadFile = (file, sessionId, password) => {
    const form = new FormData();
    form.append('file', file);
    form.append('password', password);
    form.append('session_id', sessionId);
    form.append('enable_ip_lock', true);

    return API.post('/upload/', form, {
        responseType: 'blob',
    });
};

export const reconstructFromZip = (zipFile, password) => {
    const form = new FormData();
    form.append('zip', zipFile);
    form.append('password', password);
    return API.post('/reconstruct/', form, {
        responseType: 'blob',
    });
};

export default API;