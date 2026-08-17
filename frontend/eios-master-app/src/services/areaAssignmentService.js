const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5050/api";

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
        : "Area assignment request failed.");

    throw new Error(message);
  }

  return body;
}

export async function getOwnAreaAssignments() {
  const response = await fetch(
    `${API_BASE_URL}/area-assignments/mine`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  return handleResponse(response);
}