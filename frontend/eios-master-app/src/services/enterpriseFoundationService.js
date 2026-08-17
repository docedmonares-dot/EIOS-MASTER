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

export async function getEnterpriseProfile() {
  const response = await axios.get(
    `${API}/enterprise-foundation/profile`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getEnterprisePrinciples() {
  const response = await axios.get(
    `${API}/enterprise-foundation/principles`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getEnterpriseSettings() {
  const response = await axios.get(
    `${API}/enterprise-foundation/settings`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data;
}

export async function updateEnterpriseSetting(
  settingId,
  settingValue,
  changeReason
) {
  const response = await axios.patch(
    `${API}/enterprise-foundation/settings/${settingId}`,
    {
      setting_value: settingValue,
      change_reason: changeReason,
    },
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data;
}
