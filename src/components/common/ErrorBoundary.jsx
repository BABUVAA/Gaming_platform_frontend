import React, { Component } from "react";
import PropTypes from "prop-types";

/**
 * ErrorBoundary component catches JavaScript errors in the component tree
 * and displays a fallback UI instead of crashing the app.
 */
class ErrorBoundary extends Component {
  state = {
    hasError: false,
  };

  // Update state to render fallback UI on error
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  // Log error details for debugging
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong. Please try again later .</h1>;
    }

    return this.props.children; // Render children if no error occurs
  }
}

// Validate that children prop is passed
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErrorBoundary;
