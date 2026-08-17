const axios = require('axios');

async function testAddQ003ToCore() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-questions',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                section_id: '717a991f-3a4a-4a0a-bff3-ae9352abd786',
                question_id: 'f7a2b1c2-9036-4b05-8226-7a8c1ae7d627',
                page_number: 2,
                sort_order: 1,
                required_override: true
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testAddQ003ToCore();