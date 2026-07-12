import { Provider } from "react-redux";
import { RouterProvider } from "react-router-dom";
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import platformStore from "../store";
import routes from "../routes/routes";
import { SocketProvider } from "../context/socketContext";
import ErrorBoundary from "../components/common/ErrorBoundary";
import LoadingSpinner from "../components/common/LoadingSpinner";

const persistor = persistStore(platformStore);

const AppProvider = () => (
  <ErrorBoundary>
    <Provider store={platformStore}>
      <PersistGate
        // The app shell should wait for persisted auth state before mounting
        // routes so redirects and protected screens start from a stable base.
        loading={<LoadingSpinner />}
        persistor={persistor}
      >
        <SocketProvider>
          <RouterProvider router={routes} />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);

export default AppProvider;
