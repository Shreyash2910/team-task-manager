import axios from 'axios';

const API = axios.create({
    // Iski jagah apna Railway wala Backend URL daalo
    baseURL: 'https://team-task-manager-production-e916.up.railway.app/'
});

// Agar tum JWT Token use kar rahe ho toh ye line zaroori hai
API.interceptors.request.use((req) => {
    if (localStorage.getItem('token')) {
        req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
    }
    return req;
});

export default API;