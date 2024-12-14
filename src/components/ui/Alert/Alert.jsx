import React from "react";
import PropTypes from "prop-types";
import "./Alert.css";

const Alert = ({ message, type = "success", onClose }) => {
  return (
    <div className={`alert alert-${type}`}>
      <span>{message}</span>
      <button className="alert-close" onClick={onClose}>
        ×
      </button>
    </div>
  );
};

Alert.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "warning"]),
  onClose: PropTypes.func.isRequired,
};

export default Alert;
