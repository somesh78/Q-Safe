import axios from 'axios';

const API = axios.create({
    baseURL: "http://localhost:8000/api",
});

export const createSession = (mode) => {
    return API.post('/session/create/', { mode });
};

export const uploadFile = (file, sessionId, password) => {
    const form = new FormData();
    form.append('file', file);
    form.append('password', password);
    form.append('session_id', sessionId);

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
}