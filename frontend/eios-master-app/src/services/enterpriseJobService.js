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

export async function getEnterpriseJobSummary() {
  const response = await axios.get(
    `${API}/enterprise-jobs/summary`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getEnterpriseJobTypes() {
  const response = await axios.get(
    `${API}/enterprise-jobs/types`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getRecentEnterpriseJobs(limit = 20) {
  const response = await axios.get(
    `${API}/enterprise-jobs/recent`,
    {
      params: { limit },
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function createEnterpriseTestJob() {
  const response = await axios.post(
    `${API}/enterprise-jobs/test`,
    {},
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}
