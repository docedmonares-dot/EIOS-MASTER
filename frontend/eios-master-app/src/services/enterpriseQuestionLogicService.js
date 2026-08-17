import axios from "axios";
import { API_BASE_URL } from "../config/runtime";

const API = API_BASE_URL;
const TOKEN_KEY = "eios_token";
const QUESTION_LOGIC_ENDPOINT =
  `${API}/question-logic`;

function getAuthorizationHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error(
      "Authentication token is missing."
    );
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function extractResponseData(response) {
  if (
    response?.data &&
    Object.prototype.hasOwnProperty.call(
      response.data,
      "data"
    )
  ) {
    return response.data.data;
  }

  return response?.data;
}

export async function getEnterpriseQuestionLogic() {
  const response = await axios.get(
    QUESTION_LOGIC_ENDPOINT,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

export async function getEnterpriseQuestionLogicById(
  logicId
) {
  const response = await axios.get(
    `${QUESTION_LOGIC_ENDPOINT}/${logicId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

export async function getEnterpriseQuestionLogicByQuestionId(
  questionId
) {
  const response = await axios.get(
    `${QUESTION_LOGIC_ENDPOINT}/question/${questionId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

export async function createEnterpriseQuestionLogic(
  logicData
) {
  const response = await axios.post(
    QUESTION_LOGIC_ENDPOINT,
    logicData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

export async function updateEnterpriseQuestionLogic(
  logicId,
  logicData
) {
  const response = await axios.put(
    `${QUESTION_LOGIC_ENDPOINT}/${logicId}`,
    logicData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

export async function deleteEnterpriseQuestionLogic(
  logicId
) {
  const response = await axios.delete(
    `${QUESTION_LOGIC_ENDPOINT}/${logicId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}
