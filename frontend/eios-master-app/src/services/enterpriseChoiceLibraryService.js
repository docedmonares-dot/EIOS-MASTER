import axios from "axios";

const API = "http://localhost:5050/api";
const TOKEN_KEY = "eios_token";

const CHOICE_LIBRARY_ENDPOINT =
  `${API}/choice-library`;

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

export async function getEnterpriseChoiceLists() {
  const response = await axios.get(
    CHOICE_LIBRARY_ENDPOINT,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}

export async function getEnterpriseChoiceListById(
  choiceListId
) {
  if (!choiceListId) {
    throw new Error(
      "Choice List ID is required."
    );
  }

  const response = await axios.get(
    `${CHOICE_LIBRARY_ENDPOINT}/${choiceListId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return extractResponseData(response);
}