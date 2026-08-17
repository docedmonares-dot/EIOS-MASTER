const axios = require('axios');

async function testListSurveyVersions() {
    try {
        const response = await axios.get(
            'http://localhost:5050/api/survey-versions/6f0cd760-20fb-471e-801a-a1f86f51b7e6'
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testListSurveyVersions();