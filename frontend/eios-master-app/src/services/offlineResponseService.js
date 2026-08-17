import { API_BASE_URL } from "../config/runtime";

function getAuthToken() {
  return localStorage.getItem(
    "eios_token"
  );
}

function buildHeaders() {
  const token = getAuthToken();

  return {
    "Content-Type": "application/json",

    ...(token
      ? {
          Authorization:
            `Bearer ${token}`,
        }
      : {}),
  };
}

async function handleResponse(response) {
  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let body;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    body =
      await response.json();
  } else {
    body =
      await response.text();
  }

  if (!response.ok) {
    const message =
      body?.message ||
      body?.error ||
      (typeof body === "string"
        ? body
        : "Offline response request failed.");

    throw new Error(message);
  }

  return body;
}

export async function createOfflineResponse(
  payload
) {
  const response = await fetch(
    `${API_BASE_URL}/offline-responses`,
    {
      method: "POST",
      headers: buildHeaders(),
      body: JSON.stringify(
        payload || {}
      ),
    }
  );

  return handleResponse(response);
}

export async function getOwnOfflineResponses() {
  const response = await fetch(
    `${API_BASE_URL}/offline-responses/mine`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  return handleResponse(response);
}

export async function syncOwnOfflineResponse(
  offlineResponseId
) {
  if (!offlineResponseId) {
    throw new Error(
      "Offline response ID is required."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/offline-responses/sync-own/${offlineResponseId}`,
    {
      method: "POST",
      headers: buildHeaders(),
    }
  );

  return handleResponse(response);
}
