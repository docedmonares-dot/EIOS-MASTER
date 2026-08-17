const axios = require('axios');

async function testCreateCoreSection() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-sections',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                section_code: 'SEC002',
                section_title: 'Core Election Metrics',
                section_description: 'Awareness, satisfaction, trust, preference, and tenacity questions',
                page_number: 2,
                sort_order: 2
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateCoreSection();