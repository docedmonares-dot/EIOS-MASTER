import axios from "axios";
import { API_BASE_URL } from "../config/runtime";

const API = API_BASE_URL;
const TOKEN_KEY = "eios_token";

function getAuthorizationHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function getSurveyEngineSummary() {
  const response = await axios.get(
    `${API}/survey-engine/summary`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getSurveyCoverageLevels() {
  const response = await axios.get(
    `${API}/survey-engine/coverage-levels`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getSurveyProjects(limit = 50) {
  const response = await axios.get(
    `${API}/survey-engine/projects`,
    {
      params: { limit },
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function createSurveyProject(projectData) {
  if (!projectData || typeof projectData !== "object") {
    throw new Error("Survey project data is required.");
  }

  const response = await axios.post(
    `${API}/survey-engine/projects`,
    projectData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}
