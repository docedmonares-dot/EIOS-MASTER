import { API_BASE_URL } from "../config/runtime";

function headers(json = false) {
  const token = localStorage.getItem("eios_token");
  return {
    ...(json ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function read(response) {
  const body = await response.json();
  if (!response.ok) throw new Error(body?.message || "GPS validation request failed.");
  return body;
}

export async function getGpsValidations() {
  const body = await read(await fetch(`${API_BASE_URL}/gps-validations`, { headers: headers() }));
  return Array.isArray(body?.data) ? body.data : [];
}

export async function reviewGpsValidation(id, reviewStatus, justification) {
  return read(await fetch(`${API_BASE_URL}/gps-validations/${id}/review`, {
    method: "POST",
    headers: headers(true),
    body: JSON.stringify({ review_status: reviewStatus, justification }),
  }));
}
