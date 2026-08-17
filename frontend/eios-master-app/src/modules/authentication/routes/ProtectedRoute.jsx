import { Navigate, useLocation } from "react-router-dom";

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
  } = useAuth();

  const location = useLocation();

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
        </div>
      </div>
    );
  }

  return children;
}
