// frontend/src/services/api.js

import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:5002", // The base URL of your Django backend
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Get the token from local storage
    if (token) {
      // If the token exists, add it to the request's Authorization header
      config.headers["Authorization"] = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
