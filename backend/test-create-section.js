const axios = require('axios');

async function testCreateSection() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-sections',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                section_code: 'SEC001',
                section_title: 'Respondent Profile',
                section_description: 'Basic respondent information',
                page_number: 1,
                sort_order: 1
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateSection();