import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import platformStore, { persistor } from "../store";
import routes from "../routes/routes";
import { SocketProvider } from "../context/socketContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import LoadingSpinner from "../components/common/LoadingSpinner";

// This component is the application composition root.
// It wires together the providers that must exist before any page renders.
const AppProvider = () => (
  <ErrorBoundary>
    {/* Redux Provider makes the central store available to the whole app. */}
    <Provider store={platformStore}>
      <PersistGate
        // The app shell should wait for persisted auth state before mounting
        // routes so redirects and protected screens start from a stable base.
        loading={<LoadingSpinner />}
        persistor={persistor}
      >
        {/* SocketProvider lives inside Redux because it dispatches store actions
            and reads current auth-related state during live events. */}
        <SocketProvider>
          {/* RouterProvider mounts the full route tree after the app runtime is ready. */}
          <RouterProvider router={routes} />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);

export default AppProvider;
