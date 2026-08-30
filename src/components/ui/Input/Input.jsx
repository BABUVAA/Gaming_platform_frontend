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
  iconEndLabel,
  onIconEndClick,
  className = "",
  ariaLabel,
  ...props
}) => {
  const inputBaseClasses =
    "w-full rounded-2xl border px-4 py-3 text-sm outline-none transition";
  const inputErrorClasses = error
    ? "border-rose-500 focus:border-rose-400"
    : "border-slate-600 focus:border-amber-300";
  const inputDisabledClasses = disabled
    ? "cursor-not-allowed bg-slate-700 text-slate-500"
    : "bg-slate-700 text-slate-100";

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="mb-2 block text-sm font-semibold text-slate-300"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {iconStart && (
          <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-500">
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
            iconStart ? "pl-11" : ""
          } ${iconEnd ? "pr-11" : ""} ${className}`}
          {...props}
        />

        {iconEnd && onIconEndClick ? (
          <button
            type="button"
            aria-label={iconEndLabel}
            onClick={onIconEndClick}
            disabled={disabled}
            className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 transition hover:text-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300 disabled:cursor-not-allowed disabled:text-slate-600"
          >
            {iconEnd}
          </button>
        ) : iconEnd ? (
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500">
            {iconEnd}
          </span>
        ) : null}
      </div>
      {error && <p className="mt-2 text-sm text-rose-300">{error}</p>}
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
  iconEndLabel: PropTypes.string,
  onIconEndClick: PropTypes.func,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Input;
