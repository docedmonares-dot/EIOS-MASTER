import axios from "axios";
import { API_BASE_URL } from "../config/runtime";

const API = API_BASE_URL;

const QUESTION_TYPES_ENDPOINT =
  `${API}/question-types`;

const QUESTION_CATEGORIES_ENDPOINT =
  `${API}/question-categories`;

/* =========================================================
   QUESTION TYPES
========================================================= */

export async function getEnterpriseQuestionTypes() {
  const response = await axios.get(
    QUESTION_TYPES_ENDPOINT
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}

/* =========================================================
   QUESTION CATEGORIES
========================================================= */

export async function getEnterpriseQuestionCategories() {
  const response = await axios.get(
    QUESTION_CATEGORIES_ENDPOINT
  );

  return Array.isArray(response.data)
    ? response.data
    : [];
}
