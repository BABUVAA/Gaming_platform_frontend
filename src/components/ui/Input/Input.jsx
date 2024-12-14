import React from "react";
import PropTypes from "prop-types";
import "./Input.css";

const Input = ({
  id,
  name,
  type = "text",
  placeholder = "",
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  error = "",
  label,
  iconStart = null,
  iconEnd = null,
  className = "",
  ariaLabel,
  ...props
}) => {
  // Helper function to combine classes manually
  const combineClasses = (...classes) => {
    return classes.filter(Boolean).join(" ");
  };

  // Determine the input's CSS classes
  const inputClasses = combineClasses(
    "input", // Default input class
    error && "input-error", // Error state
    disabled && "input-disabled", // Disabled state
    className // Additional custom classes passed via props
  );

  return (
    <div className="input-container">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {iconStart && (
          <span className="input-icon input-icon-start">{iconStart}</span>
        )}

        <input
          id={id}
          name={name}
          type={type}
          className={inputClasses}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          aria-label={ariaLabel || placeholder}
          {...props} // Spread any additional props like `data-*` attributes
        />

        {iconEnd && (
          <span className="input-icon input-icon-end">{iconEnd}</span>
        )}
      </div>

      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

// Prop validation to ensure correct prop types and values
Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.oneOf([
    "text",
    "password",
    "email",
    "number",
    "search",
    "tel",
    "url",
    "date",
    "file",
  ]),
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  label: PropTypes.string,
  iconStart: PropTypes.node,
  iconEnd: PropTypes.node,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Input;
