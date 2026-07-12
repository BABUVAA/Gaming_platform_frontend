import { useDispatch, useSelector, useStore as useReduxStore } from "react-redux";

export const useStore = () => {
  // This file is intentionally lightweight for now.
  // We will centralize shared Redux Toolkit access helpers here later.
  const dispatch = useDispatch();
  const store = useReduxStore();

  return {
    dispatch,
    store,
    useSelector,
  };
};

export default useStore;
