import { API_BASE_URL } from "../config/runtime";

function authorizationHeaders() {
  const token = localStorage.getItem("eios_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function read(response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message || "Notification request failed.");
  return body;
}

export async function getMyNotifications() {
  return read(await fetch(`${API_BASE_URL}/notifications/mine`, {
    headers: authorizationHeaders(),
  }));
}

export async function markNotificationRead(notificationId) {
  return read(await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
    method: "POST",
    headers: authorizationHeaders(),
  }));
}
