import { Provider } from "react-redux"; // Provides Redux store context
import { RouterProvider } from "react-router-dom"; // Provides Router context
import platformStore from "../../store"; // Redux store for global state management
import routes from "../../routes/routes"; // Routes configuration for the app
import ErrorBoundary from "./ErrorBoundary"; // Custom error boundary component
import { PersistGate } from "redux-persist/integration/react";
import { persistStore } from "redux-persist";
import { SocketProvider } from "../../context/socketContext";
import LoadingSpinner from "./LoadingSpinner"; // Custom loading spinner

// Initialize the persistor for Redux Persist
let persistor = persistStore(platformStore);

const AppProvider = () => (
  <ErrorBoundary>
    <Provider store={platformStore}>
      <PersistGate loading={<LoadingSpinner />} persistor={persistor}>
        <SocketProvider>
          <RouterProvider router={routes} />
        </SocketProvider>
      </PersistGate>
    </Provider>
  </ErrorBoundary>
);

export default AppProvider;
