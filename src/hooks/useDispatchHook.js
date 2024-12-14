import { useDispatch } from "react-redux";

const useDispatchHook = () => {
  const dispatch = useDispatch();

  const dispatchAction = (action) => {
    dispatch(action);
  };

  return {
    dispatchAction,
  };
};

export default useDispatchHook;
