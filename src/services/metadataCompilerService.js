import axios from "axios";

const API = "http://localhost:5050/api";
const TOKEN_KEY = "eios_token";

function headers() {
    const token = localStorage.getItem(TOKEN_KEY);

    return {
        Authorization: `Bearer ${token}`,
    };
}

export async function compileSurveyPreview(
    surveyId
) {
    const response = await axios.get(
        `${API}/metadata-compiler/${surveyId}/preview`,
        {
            headers: headers(),
        }
    );

    return response.data.data;
}

export async function compileSurveyPublication(
    surveyId
) {
    const response = await axios.get(
        `${API}/metadata-compiler/${surveyId}/publication`,
        {
            headers: headers(),
        }
    );

    return response.data.data;
}