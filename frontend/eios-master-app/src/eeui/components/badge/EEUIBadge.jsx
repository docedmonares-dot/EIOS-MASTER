import "./EEUIBadge.css";

export default function EEUIBadge({
  children,
  variant = "neutral",
  size = "medium",
  dot = false,
  icon: Icon = null,
  className = "",
  ...badgeProps
}) {
  const classes = [
    "eeui-badge",
    `eeui-badge--${variant}`,
    `eeui-badge--${size}`,
    dot ? "eeui-badge--with-dot" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      {...badgeProps}
    >
      {dot && (
        <span
          className="eeui-badge__dot"
          aria-hidden="true"
        />
      )}

      {Icon && (
        <Icon
          size={14}
          className="eeui-badge__icon"
          aria-hidden="true"
        />
      )}

      <span className="eeui-badge__label">
        {children}
      </span>
    </span>
  );
}