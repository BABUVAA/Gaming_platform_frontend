import { useEffect, useRef } from "react";
import PropTypes from "prop-types";
import { useAuthStore } from "../store/useStore";

const SessionBootstrap = ({ children }) => {
  const hasRequestedVerification = useRef(false);
  const { verifyCurrentSession } = useAuthStore();

  useEffect(() => {
    // Session initialization belongs above the router so authentication does
    // not depend on any specific layout or route domain being mounted first.
    if (hasRequestedVerification.current) {
      return;
    }

    // StrictMode can run effects more than once during development. This latch,
    // together with the thunk condition, keeps bootstrap to one active request.
    hasRequestedVerification.current = true;
    verifyCurrentSession();
  }, [verifyCurrentSession]);

  // Bootstrap coordinates store state without adding another visual wrapper.
  // Route guards remain responsible for showing loading and recovery states.
  return children;
};

SessionBootstrap.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SessionBootstrap;
