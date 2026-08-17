import { API_BASE_URL } from "../config/runtime";

export async function getSystemHealth() {
  const token = localStorage.getItem("eios_token");
  const response = await fetch(`${API_BASE_URL}/system-health`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || "System health check failed.");
  }
  return body;
}
