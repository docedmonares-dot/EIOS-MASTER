const axios = require('axios');

async function testCreateWave() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-waves',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                wave_code: 'WAVE001',
                wave_name: 'Baseline Wave',
                survey_date: '2026-06-24',
                status: 'Planned'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateWave();