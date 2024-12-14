import { Provider } from "react-redux"; // Provides Redux store context
import { RouterProvider } from "react-router-dom"; // Provides Router context
import platformStore from "../../store"; // Redux store for global state management
import routes from "../../routes/routes"; // Routes configuration for the app
import ErrorBoundary from "./ErrorBoundary"; // Custom error boundary component

/**
 * AppProvider component wraps the app with necessary context providers:
 * - ReduxProvider: Global state management using Redux
 * - AuthProvider: Manages authentication state
 * - LoadingProvider: Manages loading spinner state
 * - RouterProvider: Provides routing to the app
 */
const AppProvider = () => (
  <ErrorBoundary>
    <Provider store={platformStore}>
      <RouterProvider router={routes} />
    </Provider>
  </ErrorBoundary>
);

export default AppProvider;
