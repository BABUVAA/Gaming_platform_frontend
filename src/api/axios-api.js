import axios from "axios";

// Create an axios instance with baseURL
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL, // Backend URL using environment variable
  withCredentials: true, // Send cookies with each request (useful for session-based auth)
});

// Add a response interceptor to handle errors globally
api.interceptors.response.use(
  (response) => response, // Pass successful responses directly
  (error) => {
    // Log error details for debugging
    console.error("API Error:", error.response?.data || error.message);

    // Handle 401 Unauthorized (e.g., redirect to login)
    if (error.response?.status === 401) {
      // Optionally clear session or redirect
      console.warn("Unauthorized: Redirecting to home");
      window.location.href = "/";
    }

    return Promise.reject(error); // Forward the error for component-specific handling
  }
);

// Optional: Add a request interceptor to attach tokens to the headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("jwt"); // Get token from localStorage
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`; // Add the token to headers
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
