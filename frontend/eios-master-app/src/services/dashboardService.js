import axios from "axios";
import { API_BASE_URL } from "../config/runtime";

const API = API_BASE_URL;
const TOKEN_KEY = "eios_token";

export async function getDashboardSummary() {
  const token = localStorage.getItem(TOKEN_KEY);

  if (!token) {
    throw new Error("Authentication token is missing.");
  }

  const response = await axios.get(
    `${API}/dashboard/executive`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data;
}
