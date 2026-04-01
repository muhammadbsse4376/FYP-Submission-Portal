import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token") || localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Normalize error responses — backend uses both "error" and "msg" keys
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      // Unify to always have an "error" key
      if (!data.error && data.msg) {
        data.error = data.msg;
      }
    }
    return Promise.reject(error);
  }
);

export default API;
