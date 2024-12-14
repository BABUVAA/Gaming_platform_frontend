import React from "react";
import PropTypes from "prop-types";
import "./Button.css";

const Button = ({
  id,
  type = "button", // Default button type
  variant = "primary", // Style variant (e.g., primary, secondary)
  size = "medium", // Button size (small, medium, large)
  isLoading = false, // Loading state
  disabled = false, // Disabled state
  onClick, // Event handler
  children, // Button content
  className = "", // Additional classes
  startIcon = null, // Icon on the left
  endIcon = null, // Icon on the right
  ariaLabel,
  ...props // Additional props
}) => {
  // Helper function to combine classes manually
  const combineClasses = (...classes) => {
    return classes.filter(Boolean).join(" ");
  };

  // Button class based on variant, size, disabled, and loading states
  const buttonClasses = combineClasses(
    "btn", // Base class
    `btn-${variant}`, // Dynamic variant class
    `btn-${size}`, // Dynamic size class
    { "btn-disabled": disabled || isLoading }, // Conditionally apply disabled/loading classes
    className // Custom classes
  );

  return (
    <button
      id={id}
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label={ariaLabel || children}
      {...props} // Spread any additional props (e.g., data-* attributes)
    >
      {isLoading && <span className="spinner" />} {/* Loader */}
      {startIcon && (
        <span className="button-icon button-icon-start">{startIcon}</span>
      )}
      <span className="button-text">{children}</span>
      {endIcon && (
        <span className="button-icon button-icon-end">{endIcon}</span>
      )}
    </button>
  );
};

// Define prop types for better validation
Button.propTypes = {
  id: PropTypes.string,
  type: PropTypes.oneOf(["button", "submit", "reset"]),
  variant: PropTypes.oneOf([
    "primary",
    "secondary",
    "success",
    "danger",
    "link",
    "transparent",
  ]),
  size: PropTypes.oneOf(["small", "medium", "large", "xl", "xxl"]),
  isLoading: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  startIcon: PropTypes.node,
  endIcon: PropTypes.node,
  ariaLabel: PropTypes.string,
};

export default Button;
