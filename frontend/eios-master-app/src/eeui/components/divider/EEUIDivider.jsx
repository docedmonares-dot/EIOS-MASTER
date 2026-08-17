import "./EEUIDivider.css";

export default function EEUIDivider({
  orientation = "horizontal",
  label = "",
  className = "",
}) {
  const classes = [
    "eeui-divider",
    `eeui-divider--${orientation}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (label) {
    return (
      <div className={classes}>
        <span className="eeui-divider__line" />
        <span className="eeui-divider__label">
          {label}
        </span>
        <span className="eeui-divider__line" />
      </div>
    );
  }

  return <div className={classes} />;
}