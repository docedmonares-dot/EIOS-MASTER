import {
  Navigate,
} from "react-router-dom";

import LoginCard from "../components/LoginCard";

import {
  useAuth,
} from "../context/AuthContext";

import {
  getRoleLandingRoute,
} from "../utils/roleLandingRoute";

import "../styles/login.css";

export default function LoginPage() {
  const {
    user,
    isAuthenticated,
    authLoading,
  } = useAuth();

  if (authLoading) {
    return (
      <div className="eios-auth-loading">
        <div className="eios-auth-loading-spinner" />

        <p>
          Checking secure session...
        </p>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={getRoleLandingRoute(user)}
        replace
      />
    );
  }

  return (
    <main className="eios-login-page">
      <div className="eios-command-grid" />

      <section className="eios-login-presentation">
        <div className="eios-platform-badge">
          Enterprise Intelligence and Operations System
        </div>

        <h2>
          Intelligence that guides.
          <br />
          Operations that deliver.
        </h2>

        <p>
          A unified command platform for surveys,
          census operations, deployment, field
          monitoring, geographic intelligence,
          analytics, and enterprise data management.
        </p>

        <div className="eios-capability-grid">
          <div>
            <strong>
              Field Operations
            </strong>

            <span>
              Real-time deployment oversight
            </span>
          </div>

          <div>
            <strong>
              Enterprise Analytics
            </strong>

            <span>
              Decision-ready intelligence
            </span>
          </div>

          <div>
            <strong>
              GIS Monitoring
            </strong>

            <span>
              Location-based operational visibility
            </span>
          </div>

          <div>
            <strong>
              Secure Repository
            </strong>

            <span>
              Centralized institutional records
            </span>
          </div>
        </div>
      </section>

      <div className="eios-login-card-container">
        <LoginCard />
      </div>

      <footer className="eios-login-footer">
        <span>
          EIOS Enterprise Platform Version 1.0
        </span>

        <span>
          Global Zenith Research and Consulting, Inc.
        </span>
      </footer>
    </main>
  );
}