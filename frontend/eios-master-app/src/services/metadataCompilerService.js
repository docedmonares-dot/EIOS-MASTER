import axios from "axios";

const API = "http://localhost:5050/api";
const TOKEN_KEY = "eios_token";

function getAuthorizationHeaders() {
  const token =
    localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error(
      "Authentication token is missing."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function compileSurveyPreview(
  surveyId
) {
  if (!surveyId) {
    throw new Error(
      "Survey ID is required."
    );
  }

  const response = await axios.get(
    `${API}/metadata-compiler/${surveyId}/preview`,
    {
      headers:
        getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function compileSurveyPublication(
  surveyId
) {
  if (!surveyId) {
    throw new Error(
      "Survey ID is required."
    );
  }

  const response = await axios.get(
    `${API}/metadata-compiler/${surveyId}/publication`,
    {
      headers:
        getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}