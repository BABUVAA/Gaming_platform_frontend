import axios from "axios";
import { normalizeApiError } from "./apiError";

const configuredTimeout = Number(import.meta.env.VITE_API_TIMEOUT_MS);
const requestTimeout =
  Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? configuredTimeout
    : 15000;

// One public backend origin keeps HTTP requests and Socket.IO on the same
// production service while local development can still use localhost.
const configuredApiBaseUrl = import.meta.env.VITE_SERVER_URL?.trim();
export const API_BASE_URL =
  configuredApiBaseUrl?.replace(/\/+$/, "") || "/";

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: requestTimeout,
  withCredentials: true,
});

let activeRefreshRequest = null;

const waitForCookiePropagation = () =>
  new Promise((resolve) => {
    setTimeout(resolve, 100);
  });

export const refreshAuthentication = () => {
  if (activeRefreshRequest) return activeRefreshRequest;

  const executeRefresh = async () => {
    try {
      return await refreshClient.post("/api/auth/refresh", {});
    } catch (error) {
      // A second browser tab may have sent the just-rotated cookie before the
      // first response updated shared cookies. Retry once with the latest jar.
      if (
        error.response?.status === 409 &&
        error.response?.data?.error?.code === "REFRESH_ALREADY_ROTATED"
      ) {
        await waitForCookiePropagation();
        return refreshClient.post("/api/auth/refresh", {});
      }
      throw error;
    }
  };

  activeRefreshRequest = executeRefresh().finally(() => {
    activeRefreshRequest = null;
  });
  return activeRefreshRequest;
};

// Create an axios instance with baseURL
const api = axios.create({
  // Requests use the configured backend origin in every environment, so the
  // production build does not depend on static-hosting rewrite behavior.
  baseURL: API_BASE_URL,
  // Include secure session cookies on the configured backend requests.
  withCredentials: true,
  // A transport timeout prevents abandoned requests from holding Redux loading
  // counters and route guards indefinitely.
  timeout: requestTimeout,
});

const refreshExcludedPaths = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/signup",
  "/api/auth/verifySession",
]);

const shouldRefreshAuthentication = (error) => {
  const request = error.config;
  return Boolean(
    error.response?.status === 401 &&
      request &&
      !request._authRetry &&
      !request.signal?.aborted &&
      !refreshExcludedPaths.has(request.url),
  );
};

api.interceptors.response.use(
  // Successful responses remain untouched during the gradual response-contract
  // migration, so existing callers can continue reading `response.data`.
  (response) => response,
  async (error) => {
    if (shouldRefreshAuthentication(error)) {
      error.config._authRetry = true;

      try {
        await refreshAuthentication();
        return api.request(error.config);
      } catch (refreshError) {
        // Consumers receive the refresh failure because it is authoritative
        // evidence that the browser can no longer recover this session.
        refreshError.appError = normalizeApiError(refreshError);
        return Promise.reject(refreshError);
      }
    }

    // Preserve the Axios error for debugging and legacy callers while exposing
    // one safe, serializable contract to all new error handling.
    error.appError = normalizeApiError(error);
    return Promise.reject(error);
  },
);

export default api;
