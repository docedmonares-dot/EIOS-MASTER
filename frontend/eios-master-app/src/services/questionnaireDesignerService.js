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

function requireSurveyId(surveyId) {
  if (!surveyId) {
    throw new Error("Survey ID is required.");
  }
}

function requireQuestionnaireItemId(questionnaireItemId) {
  if (!questionnaireItemId) {
    throw new Error("Questionnaire Item ID is required.");
  }
}

/* =========================================================
   LOAD DESIGNER WORKSPACE
========================================================= */

export async function getQuestionnaireDesignerWorkspace(
  surveyId
) {
  requireSurveyId(surveyId);

  const response = await axios.get(
    `${API}/questionnaire-designer/${surveyId}/workspace`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function publishSurveyVersion(surveyId) {
  requireSurveyId(surveyId);

  const response = await axios.post(
    `${API}/survey-versions/${surveyId}/publish`,
    {},
    { headers: getAuthorizationHeaders() }
  );

  return response.data;
}

export async function deployLatestSurveyVersion(surveyId) {
  requireSurveyId(surveyId);

  const versionsResponse = await axios.get(
    `${API}/survey-versions/${surveyId}`,
    { headers: getAuthorizationHeaders() }
  );
  const latestVersion = versionsResponse.data?.[0];

  if (!latestVersion?.survey_version_id) {
    throw new Error("Publish a survey version before deploying it.");
  }

  const response = await axios.post(
    `${API}/survey-deployments`,
    {
      survey_id: surveyId,
      survey_version_id: latestVersion.survey_version_id,
      deployment_status: "Ready",
    },
    { headers: getAuthorizationHeaders() }
  );

  return response.data;
}

export async function getActiveEnumerators() {
  const response = await axios.get(`${API}/enumerators`, {
    headers: getAuthorizationHeaders(),
  });

  return (Array.isArray(response.data) ? response.data : []).filter(
    (personnel) => personnel.status === "Active"
  );
}

export async function assignPackageToEnumerator(
  packageDeploymentId,
  personnelId
) {
  const response = await axios.post(
    `${API}/survey-deployments/${packageDeploymentId}/assign-enumerator`,
    { personnel_id: personnelId },
    { headers: getAuthorizationHeaders() }
  );

  return response.data;
}

/* =========================================================
   SECTIONS
========================================================= */

export async function createQuestionnaireSection(
  surveyId,
  sectionData
) {
  requireSurveyId(surveyId);

  const response = await axios.post(
    `${API}/questionnaire-designer/${surveyId}/sections`,
    sectionData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function updateQuestionnaireSection(
  surveyId,
  sectionId,
  sectionData
) {
  requireSurveyId(surveyId);

  const response = await axios.put(
    `${API}/questionnaire-designer/${surveyId}/sections/${sectionId}`,
    sectionData,
    { headers: getAuthorizationHeaders() }
  );

  return response.data.data;
}

/* =========================================================
   SURVEY-LOCAL QUESTIONS
========================================================= */

export async function createSurveyLocalQuestion(
  surveyId,
  questionData
) {
  requireSurveyId(surveyId);

  const response = await axios.post(
    `${API}/questionnaire-designer/${surveyId}/local-questions`,
    questionData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   ENTERPRISE QUESTION BANK
========================================================= */

export async function addEnterpriseQuestionToSurvey(
  surveyId,
  questionData
) {
  requireSurveyId(surveyId);

  const response = await axios.post(
    `${API}/questionnaire-designer/${surveyId}/enterprise-questions`,
    questionData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   UPDATE QUESTION
========================================================= */

export async function updateQuestionnaireItem(
  surveyId,
  questionnaireItemId,
  updateData
) {
  requireSurveyId(surveyId);
  requireQuestionnaireItemId(questionnaireItemId);

  const response = await axios.put(
    `${API}/questionnaire-designer/${surveyId}/items/${questionnaireItemId}`,
    updateData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   QUESTION OPTIONS
========================================================= */

export async function updateQuestionOptions(
  surveyId,
  questionnaireItemId,
  options
) {
  requireSurveyId(surveyId);
  requireQuestionnaireItemId(questionnaireItemId);

  const response = await axios.put(
    `${API}/questionnaire-designer/${surveyId}/items/${questionnaireItemId}/options`,
    {
      options,
    },
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   DELETE QUESTION
========================================================= */

export async function deleteQuestionnaireItem(
  surveyId,
  questionnaireItemId
) {
  requireSurveyId(surveyId);
  requireQuestionnaireItemId(questionnaireItemId);

  const response = await axios.delete(
    `${API}/questionnaire-designer/${surveyId}/items/${questionnaireItemId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   REORDER QUESTIONS
========================================================= */

export async function reorderQuestionnaireItems(
  surveyId,
  orderedItems
) {
  requireSurveyId(surveyId);

  if (!Array.isArray(orderedItems)) {
    throw new Error(
      "Ordered items must be an array."
    );
  }

  const response = await axios.put(
    `${API}/questionnaire-designer/${surveyId}/items/reorder`,
    {
      items: orderedItems,
    },
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   VALIDATE QUESTIONNAIRE
========================================================= */

export async function validateQuestionnaire(
  surveyId
) {
  requireSurveyId(surveyId);

  const response = await axios.post(
    `${API}/questionnaire-designer/${surveyId}/validate`,
    {},
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

/* =========================================================
   PUBLISH QUESTIONNAIRE
========================================================= */

export async function publishQuestionnaire(
  surveyId,
  publishData = {}
) {
  requireSurveyId(surveyId);

  const response = await axios.post(
    `${API}/questionnaire-designer/${surveyId}/publish`,
    publishData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}
