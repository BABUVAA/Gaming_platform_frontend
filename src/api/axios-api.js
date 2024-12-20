import axios from "axios";

// Create an axios instance with baseURL
const api = axios.create({
  baseURL: import.meta.env.VITE_SERVER_URL, // Backend URL using environment variable
  withCredentials: true, // Send cookies with each request (useful for session-based auth)
});


export default api;
