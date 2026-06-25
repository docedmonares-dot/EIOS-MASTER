const axios = require('axios');

async function testAddQuestionToSurvey() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-questions',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                section_id: '680d741c-8bc1-4dad-bd33-0fb4f08ad023',
                question_id: 'b9c81eb1-98c2-44fb-9449-8ecb09b0fc33',
                page_number: 1,
                sort_order: 1,
                required_override: true
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testAddQuestionToSurvey();