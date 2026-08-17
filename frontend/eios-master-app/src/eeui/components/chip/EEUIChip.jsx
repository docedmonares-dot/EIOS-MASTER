import "./EEUIChip.css";

import { X } from "lucide-react";

export default function EEUIChip({
  children,
  variant = "neutral",
  size = "medium",
  selected = false,
  removable = false,
  disabled = false,
  icon: Icon = null,
  onRemove,
  className = "",
  ...props
}) {
  const classes = [
    "eeui-chip",
    `eeui-chip--${variant}`,
    `eeui-chip--${size}`,
    selected ? "eeui-chip--selected" : "",
    disabled ? "eeui-chip--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      {...props}
    >
      {Icon && (
        <Icon
          size={15}
          className="eeui-chip__icon"
        />
      )}

      <span className="eeui-chip__label">
        {children}
      </span>

      {removable && (
        <button
          type="button"
          className="eeui-chip__remove"
          onClick={onRemove}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}