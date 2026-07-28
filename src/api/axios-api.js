import axios from "axios";
import { normalizeApiError } from "./apiError";

const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const requestTimeout =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 15000;

// Create an axios instance with baseURL
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL, // Backend URL using environment variable
  withCredentials: true, // Send cookies with each request (useful for session-based auth)
  // A transport timeout prevents abandoned requests from holding Redux loading
  // counters and route guards indefinitely.
  timeout: requestTimeout,
});

api.interceptors.response.use(
  // Successful responses remain untouched during the gradual response-contract
  // migration, so existing callers can continue reading `response.data`.
  (response) => response,
  (error) => {
    // Preserve the Axios error for debugging and legacy callers while exposing
    // one safe, serializable contract to all new error handling.
    error.appError = normalizeApiError(error);
    return Promise.reject(error);
  },
);

export default api;
