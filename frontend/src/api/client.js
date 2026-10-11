import axios from "axios";

// In development, use the relative /api path so the Vite dev proxy forwards the
// request. That keeps the browser call same-origin, so CORS never applies and
// the backend CORS allowlist cannot drift when Vite picks a different port.
//
// In production the frontend is served as a static site from a different host,
// so VITE_API_URL must point at the deployed backend.
const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "/api/v1" : "http://localhost:8000/api/v1");

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default client;
