import React from "react";

const LoadingSpinner = () => {  
  const spinnerContainerStyle = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background
    zIndex: 1000, // Ensure it appears above other elements
  };

  const spinnerStyle = {
    width: "50px",
    height: "50px",
    border: "5px solid #f3f3f3", // Light gray border
    borderTop: "5px solid #3498db", // Blue border for the top
    borderRadius: "50%",
    animation: "spin 1s linear infinite", // Smooth spinning animation
  };

  const keyframesStyle = `
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  `;

  return (
    <div style={spinnerContainerStyle}>
      <style>{keyframesStyle}</style>
      <div style={spinnerStyle}></div>
    </div>
  );
};

export default LoadingSpinner;
