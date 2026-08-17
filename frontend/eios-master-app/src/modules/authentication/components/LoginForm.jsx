import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getRememberedUsername } from "../services/authService";
import PasswordField from "./PasswordField";

export default function LoginForm() {
  const rememberedUsername = getRememberedUsername();

  const [formData, setFormData] = useState({
    username: rememberedUsername,
    password: "",
    rememberMe: Boolean(rememberedUsername),
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const destination = location.state?.from?.pathname || "/dashboard";

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const username = formData.username.trim();

    if (!username || !formData.password) {
      setError("Please enter your username and password.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      await login({
        ...formData,
        username,
      });

      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError?.message || "Login failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="eios-login-form" onSubmit={handleSubmit}>
      {error && (
        <div className="eios-login-error" role="alert">
          <span className="eios-login-error-icon">!</span>
          <span>{error}</span>
        </div>
      )}

      <div className="eios-form-group">
        <label htmlFor="username">Username</label>

        <input
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          disabled={submitting}
          autoComplete="username"
          placeholder="Enter your username"
          autoFocus
        />
      </div>

      <div className="eios-form-group">
        <div className="eios-field-heading">
          <label htmlFor="password">Password</label>

          <button
            type="button"
            className="eios-text-button"
            onClick={() =>
              window.alert(
                "Password recovery will be connected to the EIOS backend in a later development phase."
              )
            }
          >
            Forgot password?
          </button>
        </div>

        <PasswordField
          value={formData.password}
          onChange={handleChange}
          disabled={submitting}
        />
      </div>

      <label className="eios-remember-option">
        <input
          name="rememberMe"
          type="checkbox"
          checked={formData.rememberMe}
          onChange={handleChange}
          disabled={submitting}
        />

        <span>Remember my username</span>
      </label>

      <button
        type="submit"
        className="eios-login-button"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <span className="eios-button-spinner" />
            Authenticating...
          </>
        ) : (
          "Access EIOS Platform"
        )}
      </button>
    </form>
  );
}