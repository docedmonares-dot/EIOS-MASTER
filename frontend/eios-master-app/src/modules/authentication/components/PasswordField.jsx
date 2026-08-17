import { useState } from "react";

export default function PasswordField({
  id = "password",
  name = "password",
  value,
  onChange,
  disabled = false,
  required = true,
}) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="eios-password-field">
      <input
        id={id}
        name={name}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        autoComplete="current-password"
        placeholder="Enter your password"
      />

      <button
        type="button"
        className="eios-password-toggle"
        onClick={() => setShowPassword((current) => !current)}
        disabled={disabled}
        aria-label={showPassword ? "Hide password" : "Show password"}
      >
        {showPassword ? "Hide" : "Show"}
      </button>
    </div>
  );
}