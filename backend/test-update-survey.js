const axios = require('axios');

async function testUpdateSurvey() {
    try {
        const response = await axios.put(
            'http://localhost:5050/api/surveys/d3977950-4e3f-4d68-bb86-e33eb761f257',
            {
                survey_name: 'EIOS Test Survey Updated',
                election_type: 'Local Election',
                geographic_scope: 'Barangay',
                description: 'Updated survey registry record through API',
                status: 'Active'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testUpdateSurvey();