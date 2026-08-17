import axios from "axios";
import { API_BASE_URL } from "../../../config/runtime";

const API = API_BASE_URL;

const TOKEN_KEY = "eios_token";
const USER_KEY = "eios_user";
const REMEMBER_KEY = "eios_remember_user";

const USERNAME_EMAIL_MAP = {
  admin: "admin@eios.local",
  supervisor: "supervisor@eios.local",
  enumerator: "enumerator@eios.local",
};

function normalizeRole(role) {
  return String(role || "")
    .trim()
    .replace(/\s+/g, "_")
    .toUpperCase();
}

function saveSession(user, token) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function login(credentials) {
  const enteredUsername =
    credentials?.username?.trim().toLowerCase() || "";

  const password = credentials?.password || "";

  const email =
    USERNAME_EMAIL_MAP[enteredUsername] ||
    enteredUsername;

  try {
    const response = await axios.post(
      `${API}/auth/login`,
      {
        email,
        password,
      }
    );

    const backendUser = response.data.user;
    const token = response.data.token;

    if (!token || !backendUser) {
      throw new Error(
        "The server returned an incomplete login response."
      );
    }

    const safeUser = {
      id: backendUser.user_id,
      user_id: backendUser.user_id,
      username: enteredUsername,
      name:
        backendUser.full_name ||
        backendUser.email,
      full_name: backendUser.full_name,
      email: backendUser.email,
      role: normalizeRole(backendUser.role),
      backendRole: backendUser.role,
    };

    saveSession(safeUser, token);

    if (credentials?.rememberMe) {
      localStorage.setItem(
        REMEMBER_KEY,
        enteredUsername
      );
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }

    return {
      token,
      user: safeUser,
    };
  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Unable to sign in.";

    throw new Error(message, {
      cause: error,
    });
  }
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getCurrentUser() {
  const storedUser =
    localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function getRememberedUsername() {
  return (
    localStorage.getItem(REMEMBER_KEY) || ""
  );
}

export function isAuthenticated() {
  return Boolean(
    getToken() &&
    getCurrentUser()
  );
}

export function hasRole(allowedRoles = []) {
  const user = getCurrentUser();

  if (!user) {
    return false;
  }

  if (
    !Array.isArray(allowedRoles) ||
    allowedRoles.length === 0
  ) {
    return true;
  }

  return allowedRoles.includes(user.role);
}
