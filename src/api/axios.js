import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

// Apply immediately on load, using whatever token already exists —
// this covers page reloads and new tabs without waiting for a React effect.
const existingToken = localStorage.getItem("orange_spa_admin_token");
if (existingToken) setAuthToken(existingToken);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Something went wrong. Please try again.";
    if (error.response) {
      message = error.response.data?.message || message;
      if (error.response.data?.errors?.length) {
        message = error.response.data.errors.map((e) => e.message).join(", ");
      }
    } else if (error.request) {
      message = "Cannot reach the server. Please check your connection.";
    }
    const normalizedError = new Error(message);
    normalizedError.statusCode = error.response?.status;
    return Promise.reject(normalizedError);
  }
);

export default api;