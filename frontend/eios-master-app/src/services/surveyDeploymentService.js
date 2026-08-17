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
    `${API_BASE_URL}/deployment-personnel/my-assignments`,
    {
      method: "GET",
      headers: buildHeaders(),
    }
  );

  const result =
    await handleResponse(response);

  const assignments =
    Array.isArray(result?.assignments)
      ? result.assignments
      : [];

  const assignment =
    assignments.find(
      (item) =>
        item.package_deployment_id ===
        deploymentId
    );

  if (!assignment) {
    throw new Error(
      "This deployment is not assigned to the current Enumerator."
    );
  }

  if (!assignment.deployment_package) {
    throw new Error(
      "The assigned deployment package is not available."
    );
  }

  return {
    deployment_id:
      assignment.package_deployment_id,

    survey_id:
      assignment.survey_id,

    survey_version_id:
      assignment.survey_version_id,

    deployment_status:
      assignment.package_status,

    deployed_at:
      assignment.package_deployed_at,

    deployment_package:
      assignment.deployment_package,

    operational_deployment_id:
      assignment.operational_deployment_id,

    enumerator_id:
      result?.personnel
        ?.personnel_id ||
      assignment.personnel_id ||
      null,

    deployment_name:
      assignment.deployment_name,

    assignment_status:
      assignment.assignment_status,

    deployment_role:
      assignment.deployment_role,
  };
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