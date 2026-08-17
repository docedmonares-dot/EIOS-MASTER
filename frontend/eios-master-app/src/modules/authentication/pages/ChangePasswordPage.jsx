import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { changePassword } from "../services/authService";
import { getRoleLandingRoute } from "../utils/roleLandingRoute";
import "../styles/login.css";

export default function ChangePasswordPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      setError("The new-password confirmation does not match.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      const result = await changePassword(form);
      updateUser(result.user);
      navigate(getRoleLandingRoute(result.user), { replace: true });
    } catch (changeError) {
      setError(changeError.message || "Unable to change the password.");
    } finally {
      setSubmitting(false);
    }
  }

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  return (
    <main className="eios-login-page">
      <div className="eios-command-grid" />
      <div className="eios-login-card-container">
        <section className="eios-login-card">
          <div className="eios-login-card-header">
            <span>Account Security</span>
            <h1>Change your password</h1>
            <p>
              {user?.must_change_password
                ? "Your temporary password must be replaced before continuing."
                : "Choose a strong new password for your account."}
            </p>
          </div>

          <form className="eios-login-form" onSubmit={handleSubmit}>
            {error && <div className="eios-login-error" role="alert">{error}</div>}

            <div className="eios-form-group">
              <label htmlFor="currentPassword">Current password</label>
              <input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" value={form.currentPassword} onChange={updateField} required />
            </div>

            <div className="eios-form-group">
              <label htmlFor="newPassword">New password</label>
              <input id="newPassword" name="newPassword" type="password" autoComplete="new-password" minLength={12} value={form.newPassword} onChange={updateField} required />
              <small>Use at least 12 characters.</small>
            </div>

            <div className="eios-form-group">
              <label htmlFor="confirmPassword">Confirm new password</label>
              <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" minLength={12} value={form.confirmPassword} onChange={updateField} required />
            </div>

            <button type="submit" className="eios-login-button" disabled={submitting}>
              {submitting ? "Updating password..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
