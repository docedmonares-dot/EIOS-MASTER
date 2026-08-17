import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({
  children,
  allowedRoles = [],
}) {
  const {
    user,
    authLoading,
    isAuthenticated,
    hasRole,
    logout,
  } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          background: "#07111f",
          color: "#cbd5e1",
        }}
      >
        Checking secure access...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (
    user?.must_change_password &&
    location.pathname !== "/change-password"
  ) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    const workspacePath = hasRole(["ENUMERATOR"])
      ? "/enumerator"
      : hasRole(["SUPERVISOR"])
        ? "/supervisor"
        : "/dashboard";

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeContent: "center",
          padding: "30px",
          textAlign: "center",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div>
          <h1>Access Denied</h1>

          <p>
            {user?.name || "This user"} does not have permission to open this
            page.
          </p>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "12px",
              marginTop: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(workspacePath, { replace: true })}
              style={{
                padding: "11px 18px",
                border: 0,
                borderRadius: "9px",
                background: "#2563eb",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Return to workspace
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate("/login", { replace: true });
              }}
              style={{
                padding: "11px 18px",
                border: "1px solid #cbd5e1",
                borderRadius: "9px",
                background: "#fff",
                color: "#334155",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
