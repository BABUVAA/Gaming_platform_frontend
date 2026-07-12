import { useDispatch, useSelector, useStore as useReduxStore } from "react-redux";

export const useStore = () => {
  // This hook is the store-facing convenience boundary for React code.
  // We will grow it with domain hooks/selectors later without changing callers.
  const dispatch = useDispatch();
  const store = useReduxStore();

  return {
    // Dispatch lets components and hooks trigger Redux actions and thunks.
    dispatch,
    // The raw store is available for advanced cases that need direct access.
    store,
    // We return useSelector here so future consumers can read state through
    // one shared store helper surface instead of importing react-redux everywhere.
    useSelector,
  };
};

export default useStore;
