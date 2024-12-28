import React from "react";
import PropTypes from "prop-types";

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
  const inputBaseClasses =
    "w-full px-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400";
  const inputErrorClasses = error ? "border-red-500" : "border-gray-300";
  const inputDisabledClasses = disabled
    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
    : "bg-white text-gray-900";

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {iconStart && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
            {iconStart}
          </span>
        )}

        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          aria-label={ariaLabel || placeholder}
          className={`${inputBaseClasses} ${inputErrorClasses} ${inputDisabledClasses} ${
            iconStart ? "pl-10" : ""
          } ${iconEnd ? "pr-10" : ""} ${className}`}
          {...props}
        />

        {iconEnd && (
          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
            {iconEnd}
          </span>
        )}
      </div>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
};

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
