import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import platformStore, { persistor } from "../store";
import routes from "../routes/routes";
import { SocketProvider } from "../context/socketContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import LoadingSpinner from "../components/common/LoadingSpinner";
import SessionBootstrap from "./SessionBootstrap";

// This component is the application composition root.
// It wires together the providers that must exist before any page renders.
//
// If we add more app-wide providers later, they should usually be added here
// instead of being scattered across `main.jsx` or feature pages. That keeps
// bootstrap ownership in one place and makes provider order easier to reason about.
const AppProvider = () => (
  <ErrorBoundary>
    {/* Redux Provider makes the central store available to the whole app. */}
    <Provider store={platformStore}>
      <PersistGate
        // The app shell should wait for persisted auth state before mounting
        // routes so redirects and protected screens start from a stable base.
        //
        // If we later replace the generic spinner with a branded bootstrap
        // screen, this `loading` prop is the right place to do it.
        loading={<LoadingSpinner />}
        persistor={persistor}
      >
        {/* Session bootstrap lives above the router so every route domain uses
            the same secure cookie verification flow. */}
        <SessionBootstrap>
          {/* SocketProvider lives inside Redux because it dispatches store actions
              and reads current auth-related state during live events.
              If realtime features grow, this can later move into `app/providers/`
              without changing the rest of the bootstrap chain. */}
          <SocketProvider>
            {/* RouterProvider mounts the full route tree after the app runtime is ready. */}
            <RouterProvider router={routes} />
          </SocketProvider>
        </SessionBootstrap>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);

export default AppProvider;
