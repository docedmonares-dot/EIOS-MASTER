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

function requireUserId(userId) {
  if (!userId) {
    throw new Error("User ID is required.");
  }
}

/* =========================================================
   GET USERS
========================================================= */

export async function getEnterpriseUsers() {
  const response = await axios.get(
    `${API}/admin-users`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data || [];
}

/* =========================================================
   CREATE USER
========================================================= */

export async function createEnterpriseUser(userData) {
  const response = await axios.post(
    `${API}/admin-users`,
    userData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data;
}

/* =========================================================
   UPDATE USER
========================================================= */

export async function updateEnterpriseUser(
  userId,
  userData
) {
  requireUserId(userId);

  const response = await axios.put(
    `${API}/admin-users/${userId}`,
    userData,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data;
}

/* =========================================================
   ARCHIVE USER
========================================================= */

export async function archiveEnterpriseUser(userId) {
  requireUserId(userId);

  const response = await axios.delete(
    `${API}/admin-users/${userId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data;
}