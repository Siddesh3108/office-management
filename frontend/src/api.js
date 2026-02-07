import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
});

// Response interceptor to catch auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error("Authentication Error");
        }
        return Promise.reject(error);
    }
);

export default api;