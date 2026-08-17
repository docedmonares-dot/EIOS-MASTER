import { API_BASE_URL } from "../config/runtime";

function headers() {
  const token = localStorage.getItem("eios_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function read(response) {
  const body = await response.json();
  if (!response.ok) {
    throw new Error(body?.message || body?.error || "Analytics request failed.");
  }
  return body;
}

export async function getAnalyticsFrequencies() {
  return read(await fetch(`${API_BASE_URL}/analytics/frequencies`, {
    headers: headers(),
  }));
}

export async function getSurveyResponses() {
  const body = await read(await fetch(`${API_BASE_URL}/survey-responses`, {
    headers: headers(),
  }));
  return Array.isArray(body) ? body : [];
}
