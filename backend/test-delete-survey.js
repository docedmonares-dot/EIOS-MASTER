const axios = require('axios');

async function testDeleteSurvey() {
    try {
        const response = await axios.delete(
            'http://localhost:5050/api/surveys/d3977950-4e3f-4d68-bb86-e33eb761f257'
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testDeleteSurvey();