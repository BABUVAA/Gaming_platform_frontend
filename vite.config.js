import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Vite reads the backend target on the development server instead of exposing
// that origin to browser code. Production hosting must provide equivalent
// reverse-proxy rules for `/api` and `/socket.io`.
export default defineConfig(({ mode }) => {
  // `"."` points Vite at this project's root without depending on Node globals
  // that are intentionally absent from the browser-focused ESLint config.
  const env = loadEnv(mode, ".", "");
  const backendProxyTarget =
    env.BACKEND_PROXY_TARGET || env.VITE_SERVER_URL;

  if (!backendProxyTarget) {
    throw new Error(
      "BACKEND_PROXY_TARGET is required to proxy API and socket requests.",
    );
  }

  // Both HTTP and Socket.IO use the same proxy options so cookies, upgrade
  // requests, and backend routing consistently pass through the frontend host.
  const backendProxy = {
    target: backendProxyTarget,
    changeOrigin: true,
    secure: true,
    ws: true,
  };

  return {
    plugins: [react()],
    build: {
      rollupOptions: {
        output: {
          // Keep long-lived framework code separate from route chunks. This
          // reduces the initial cache miss without changing route ownership.
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            if (id.includes("react-dom") || id.includes("/react/") || id.includes("react-router")) return "vendor-react";
            if (id.includes("@reduxjs") || id.includes("react-redux") || id.includes("redux-persist")) return "vendor-state";
            if (id.includes("socket.io")) return "vendor-realtime";
            if (id.includes("react-icons")) return "vendor-icons";
            return "vendor";
          },
        },
      },
    },
    server: {
      proxy: {
        "/api": backendProxy,
        "/socket.io": backendProxy,
      },
    },
    // Preview mirrors development for local production-build verification.
    // A deployed static build still needs its host or reverse proxy configured.
    preview: {
      proxy: {
        "/api": backendProxy,
        "/socket.io": backendProxy,
      },
    },
  };
});
