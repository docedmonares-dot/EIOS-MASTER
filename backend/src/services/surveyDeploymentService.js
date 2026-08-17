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

  let responseBody;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    responseBody =
      await response.json();
  } else {
    responseBody =
      await response.text();
  }

  if (!response.ok) {
    const message =
      responseBody?.message ||
      responseBody?.error ||
      (typeof responseBody ===
      "string"
        ? responseBody
        : "Survey deployment request failed.");

    throw new Error(message);
  }

  return responseBody;
}

export async function getSurveyDeploymentById(
  deploymentId
) {
  if (!deploymentId) {
    throw new Error(
      "Deployment ID is required."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/survey-deployments/${deploymentId}`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  const result =
    await handleResponse(response);

  return result?.data || null;
}

export async function getSurveyDeployments() {
  const response = await fetch(
    `${API_BASE_URL}/survey-deployments`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  const result =
    await handleResponse(response);

  return Array.isArray(result)
    ? result
    : [];
}