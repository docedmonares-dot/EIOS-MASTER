import axios from "axios";
import { API_BASE_URL } from "../config/runtime";

const API = API_BASE_URL;
const TOKEN_KEY = "eios_token";
const QUESTION_BANK_ENDPOINT = `${API}/question-bank`;

function getAuthorizationHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function requireQuestionId(questionId) {
  if (
    questionId === undefined ||
    questionId === null ||
    questionId === ""
  ) {
    throw new Error("Enterprise Question ID is required.");
  }
}

function requireQuestionData(questionData) {
  if (
    !questionData ||
    typeof questionData !== "object" ||
    Array.isArray(questionData)
  ) {
    throw new Error(
      "Enterprise Question data must be a valid object."
    );
  }
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

/* =========================================================
   ENTERPRISE QUESTION BANK
========================================================= */

/**
 * Loads all governed Enterprise Question Objects.
 */
export async function getEnterpriseQuestions() {
  const response = await axios.get(
    QUESTION_BANK_ENDPOINT,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

/**
 * Loads one Enterprise Question Object by its identifier.
 */
export async function getEnterpriseQuestionById(
  questionId
) {
  requireQuestionId(questionId);

  const response = await axios.get(
    `${QUESTION_BANK_ENDPOINT}/${questionId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

/**
 * Creates a new Enterprise Question Object.
 */
export async function createEnterpriseQuestion(
  questionData
) {
  requireQuestionData(questionData);

  const response = await axios.post(
    QUESTION_BANK_ENDPOINT,
    questionData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

/**
 * Updates an existing Enterprise Question Object.
 */
export async function updateEnterpriseQuestion(
  questionId,
  questionData
) {
  requireQuestionId(questionId);
  requireQuestionData(questionData);

  const response = await axios.put(
    `${QUESTION_BANK_ENDPOINT}/${questionId}`,
    questionData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

/**
 * Deletes an Enterprise Question Object.
 */
export async function deleteEnterpriseQuestion(
  questionId
) {
  requireQuestionId(questionId);

  const response = await axios.delete(
    `${QUESTION_BANK_ENDPOINT}/${questionId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}
