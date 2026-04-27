import axios from "axios";

const rawApiUrl = (import.meta.env.VITE_API_URL || "").trim();
const isLocalBrowser =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname);

// Never use a localhost API base on non-local deployments.
const baseURL =
  rawApiUrl && !rawApiUrl.match(/localhost|127\.0\.0\.1/i)
    ? rawApiUrl
    : rawApiUrl && isLocalBrowser
      ? rawApiUrl
      : "/api";

const API = axios.create({
  baseURL,
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
