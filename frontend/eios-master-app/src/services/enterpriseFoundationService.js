import axios from "axios";

const API = "http://localhost:5050/api";
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