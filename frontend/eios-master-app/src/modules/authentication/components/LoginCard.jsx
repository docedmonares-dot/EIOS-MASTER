import LoginForm from "./LoginForm";

export default function LoginCard() {
  return (
    <section className="eios-login-card">
      <div className="eios-login-brand">
        <div className="eios-login-logo">EIOS</div>

        <div>
          <p className="eios-login-eyebrow">Secure Enterprise Access</p>

          <h1>EIOS Enterprise Platform</h1>
        </div>
      </div>

      <div className="eios-login-introduction">
        <h2>Welcome back</h2>

        <p>
          Sign in to access enterprise intelligence, field operations,
          deployment monitoring, analytics, and administrative services.
        </p>
      </div>

      <LoginForm />

      <div className="eios-login-security">
        <span className="eios-security-indicator" />

        <span>Protected enterprise environment</span>
      </div>
    </section>
  );
}
