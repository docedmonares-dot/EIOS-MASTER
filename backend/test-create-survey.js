const axios = require('axios');

async function testCreateSurvey() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/surveys',
            {
                survey_code: 'SURV001',
                survey_name: 'EIOS Test Survey',
                election_type: 'Local Election',
                geographic_scope: 'Barangay',
                description: 'First test survey created through API',
                status: 'Draft'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateSurvey();