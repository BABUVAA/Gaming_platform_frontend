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
  };

  // Button class based on variant, size, disabled, and loading states
  const buttonClasses = combineClasses(
    "inline-flex items-center justify-center rounded-xl font-black uppercase tracking-[0.12em] transition-all focus:outline-none focus:ring-2 focus:ring-amber-200/50",
    variant === "primary" &&
      "bg-amber-300 text-slate-950 shadow-[0_12px_30px_rgba(251,191,36,0.22)] hover:bg-amber-200",
    variant === "secondary" &&
      "border border-slate-700 bg-slate-900 text-slate-100 hover:border-amber-200/60 hover:text-amber-100",
    variant === "success" &&
      "bg-emerald-500 text-slate-950 hover:bg-emerald-400",
    variant === "danger" && "bg-rose-600 text-white hover:bg-rose-500",
    variant === "link" &&
      "bg-transparent text-amber-200 underline-offset-4 hover:text-amber-100 hover:underline",
    variant === "transparent" &&
      "border border-white/15 bg-white/5 text-slate-100 backdrop-blur hover:border-amber-200/60 hover:bg-white/10 hover:text-amber-100",
    size === "xs" && "h-9 px-3 text-xs",
    size === "small" && "h-11 px-4 text-xs",
    size === "medium" && "h-12 px-5 text-sm",
    size === "large" && "h-14 px-6 text-sm",
    size === "xl" && "h-16 px-8 text-base",
    size === "xxl" && "h-20 px-10 text-lg",
    (disabled || isLoading) &&
      "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500 shadow-none hover:bg-slate-800 hover:text-slate-500",
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
        <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent"></span> // Spinner
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
