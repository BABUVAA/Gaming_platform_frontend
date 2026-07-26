import { Component } from "react";
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

    // A production monitoring client can be connected here later. Keeping the
    // reporting point centralized avoids adding crash-report calls to features.
    this.props.onError?.(error, errorInfo);
  }

  resetBoundary = () => {
    // Remount the child tree without reloading the browser. This can recover
    // from a temporary render failure while preserving current navigation.
    this.setState({ hasError: false });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="min-h-screen bg-slate-950 px-6 py-20 text-white">
          <section className="mx-auto max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-8 shadow-2xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
              Application error
            </p>
            <h1 className="mt-3 text-3xl font-bold">Something went wrong</h1>
            <p className="mt-3 text-slate-300">
              Your account data is safe. Try reopening this screen, or reload
              the application if the problem continues.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={this.resetBoundary}
                className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-950"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg border border-slate-600 px-4 py-2 font-semibold"
              >
                Reload application
              </button>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children; // Render children if no error occurs
  }
}

// Validate that children prop is passed
ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  onError: PropTypes.func,
};

ErrorBoundary.defaultProps = {
  onError: null,
};

export default ErrorBoundary;
