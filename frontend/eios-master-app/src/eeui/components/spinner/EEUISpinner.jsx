import "./EEUISpinner.css";

export default function EEUISpinner({
  size = "medium",
}) {
  return (
    <span
      className={`eeui-spinner eeui-spinner--${size}`}
    />
  );
}