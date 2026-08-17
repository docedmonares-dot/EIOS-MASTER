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

export async function getGeographicSummary() {
  const response = await axios.get(
    `${API}/geographic-master/summary`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getGeographicRoots(
  countryCode = "PH"
) {
  const response = await axios.get(
    `${API}/geographic-master/roots`,
    {
      params: {
        country_code: countryCode,
      },
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}

export async function getGeographicChildren(
  parentGeoUnitId
) {
  if (!parentGeoUnitId) {
    throw new Error(
      "Parent geographic unit ID is required."
    );
  }

  const response = await axios.get(
    `${API}/geographic-master/children/${parentGeoUnitId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data;
}

export async function getGeographicUnitById(
  geoUnitId
) {
  if (!geoUnitId) {
    throw new Error(
      "Geographic unit ID is required."
    );
  }

  const response = await axios.get(
    `${API}/geographic-master/units/${geoUnitId}`,
    {
      headers: getAuthorizationHeaders(),
    }
  );

  return response.data.data;
}