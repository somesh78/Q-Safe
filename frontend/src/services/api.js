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
    (response)=> response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            const refresh = localStorage.getItem('refresh');
            if (!refresh) {
                window.location.href = '/login';
                return Promise.reject(error);
            }
            try {
                const res= await API.post('/token/refresh/', { refresh });

                localStorage.setItem('access', res.data.access);

                originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
                return API(originalRequest);
            } catch (err) {
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }
        return Promise.reject(error);
    }
);

export const signup = (username, password) => {
    return API.post('/signup/', { username, password });
};

export const logoutUser=(refresh)=>{
    return API.post('/logout/', { refresh });
};

export const createSession = (mode) => {
    return API.post('/session/create/', { mode });
};

export const uploadFile = (file, sessionId, password, options = {}) => {
    const form = new FormData();
    form.append('file', file);
    form.append('password', password);
    form.append('session_id', sessionId);
    form.append('enable_ip_lock', options.enableIpLock !== undefined ? options.enableIpLock : true);
    form.append('max_downloads', options.maxDownloads || 3);
    form.append('expiry_hours', options.expiryHours || 1);

    return API.post('/upload/', form, {
        responseType: 'blob',
        timeout: 120000, // 2 minutes for large files with QR generation
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