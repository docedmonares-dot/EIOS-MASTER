const ROLE_LANDING_ROUTES = {
  admin: "/dashboard",
  "system administrator": "/dashboard",
  super_admin: "/dashboard",
  "super admin": "/dashboard",

  enumerator: "/enumerator",

  supervisor: "/supervisor",

  operations_manager: "/deployment",
  "operations manager": "/deployment",

  statistician: "/analytics",
  analyst: "/analytics",
  "research analyst": "/analytics",

  executive: "/dashboard",
  "project director": "/dashboard",

  qa: "/supervisor",
  "quality assurance": "/supervisor",
  "quality assurance officer": "/supervisor",
};

export function normalizeRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function getRoleLandingRoute(user) {
  const role =
    user?.backendRole ??
    user?.role ??
    "";

  const normalizedRole =
    normalizeRole(role);

  return (
    ROLE_LANDING_ROUTES[normalizedRole] ||
    "/dashboard"
  );
}
