import "./EEUIButton.css";

export default function EEUIButton({
  children,
  type = "button",
  variant = "primary",
  size = "medium",
  icon: Icon = null,
  iconPosition = "left",
  fullWidth = false,
  loading = false,
  disabled = false,
  className = "",
  ...buttonProps
}) {
  const classes = [
    "eeui-button",
    `eeui-button--${variant}`,
    `eeui-button--${size}`,
    fullWidth ? "eeui-button--full-width" : "",
    loading ? "eeui-button--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={classes}
      disabled={isDisabled}
      aria-busy={loading}
      {...buttonProps}
    >
      {loading && (
        <span
          className="eeui-button__spinner"
          aria-hidden="true"
        />
      )}

      {!loading &&
        Icon &&
        iconPosition === "left" && (
          <Icon
            size={16}
            className="eeui-button__icon"
            aria-hidden="true"
          />
        )}

      <span className="eeui-button__label">
        {children}
      </span>

      {!loading &&
        Icon &&
        iconPosition === "right" && (
          <Icon
            size={16}
            className="eeui-button__icon"
            aria-hidden="true"
          />
        )}
    </button>
  );
}