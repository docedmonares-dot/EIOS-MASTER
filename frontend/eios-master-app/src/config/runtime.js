function stripTrailingSlash(value) {
  return String(value || "").replace(/\/+$/, "");
}

export const API_BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:5050/api"
);

export const SOCKET_URL = stripTrailingSlash(
  import.meta.env.VITE_SOCKET_URL ||
    API_BASE_URL.replace(/\/api$/, "")
);
