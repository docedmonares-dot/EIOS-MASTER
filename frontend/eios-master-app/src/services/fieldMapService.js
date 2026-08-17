import { API_BASE_URL } from "../config/runtime";

export async function getEnterpriseFieldMap() {
  const token = localStorage.getItem("eios_token");
  const response = await fetch(`${API_BASE_URL}/field-map`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || body?.error || "Unable to load field map.");
  }
  return Array.isArray(body?.data) ? body.data : [];
}
