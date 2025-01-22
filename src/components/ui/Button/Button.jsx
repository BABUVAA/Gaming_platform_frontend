import React from "react";
import PropTypes from "prop-types";

const Button = ({
  id,
  type = "button", // Default button type
  variant = "primary", // Style variant (e.g., primary, secondary)
  size = "small", // Button size (small, medium, large)
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
    buttonClasses;
  };

  // Button class based on variant, size, disabled, and loading states
  const buttonClasses = combineClasses(
    "inline-flex items-center justify-center font-medium  transition-all",
    variant === "primary" && "bg-blue-600 text-white hover:bg-blue-500",
    variant === "secondary" && "bg-gray-600 text-white hover:bg-gray-500",
    variant === "success" && "bg-green-600 text-white hover:bg-green-500",
    variant === "danger" && "bg-red-600 text-white hover:bg-red-500",
    variant === "link" &&
      "bg-transparent text-blue-600 hover:text-blue-400 underline",
    variant === "transparent" &&
      "bg-transparent text-gray-600 border-2 border-gray-400 hover:text-blue-600 hover:border-blue-600",
    size === "xs" &&" text-sm w-24 h-10",
    size === "small" && "text-sm  px-3 py-1.5 w-24 h-11",
    size === "medium" && "text-base px-4 py-2 w-36 h-12",
    size === "large" && "text-lg px-6 py-3 w-48 h-14",
    size === "xl" && "text-xl px-8 py-4 w-60 h-16",
    size === "xxl" && "text-xl px-8 py-5 w-72 h-20",
    (disabled || isLoading) && "bg-gray-300 text-gray-600 cursor-not-allowed",
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
      {isLoading && (
        <span className="mr-2 w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span> // Spinner
      )}
      {startIcon && <span className="mr-2">{startIcon}</span>}{" "}
      {/* Start icon */}
      <span>{children}</span>
      {endIcon && <span className="ml-2">{endIcon}</span>} {/* End icon */}
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
  size: PropTypes.oneOf(["xs","small", "medium", "large", "xl", "xxl"]),
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
