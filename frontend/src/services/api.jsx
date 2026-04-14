// frontend/src/services/api.js

import axios from "axios";

const api = axios.create({
  // Use same-origin requests by default so Docker/Nginx deployments work.
  baseURL: import.meta.env.VITE_API_BASE_URL || "",
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
