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

    // For offline mode, don't use blob responseType (we'll get job_id JSON)
    // For online mode, keep blob for backward compatibility with QR code image
    return API.post('/upload/', form, {
        timeout: 120000, // 2 minutes
    });
};

export const getJobStatus = (jobId) => {
    return API.get(`/job-status/${jobId}/`);
};

export const downloadJobResult = (jobId) => {
    return API.get(`/job-download/${jobId}/`, {
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

// Submit contact form payload for support/sales/security inquiries
export const submitContactMessage = (payload) => {
    return API.post('/contact/', payload);
};

export default API;