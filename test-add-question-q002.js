const axios = require('axios');

async function testAddQ002ToSurvey() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-questions',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                section_id: '680d741c-8bc1-4dad-bd33-0fb4f08ad023',
                question_id: '47959e26-ac06-4f8b-aac7-0cfc2d4276a4',
                page_number: 1,
                sort_order: 2,
                required_override: true
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testAddQ002ToSurvey();