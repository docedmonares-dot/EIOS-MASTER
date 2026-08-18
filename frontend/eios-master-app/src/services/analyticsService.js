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

export async function downloadSurveyData(surveyId, format) {
  const response = await fetch(
    `${API_BASE_URL}/data-exports/surveys/${surveyId}/${format}`,
    { headers: headers() }
  );

  if (!response.ok) {
    let message = "Data export failed.";
    try {
      const body = await response.json();
      message = body?.message || body?.error || message;
    } catch {
      // The server may return a plain error response.
    }
    throw new Error(message);
  }

  const disposition = response.headers.get("content-disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `eios-survey.${format === "excel" ? "xlsx" : "sav"}`;
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
