const axios = require('axios');

async function testCreateResponse() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-responses',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                survey_version_id: 'bcacb389-6af1-460f-83fe-6d8e378d83de',
                wave_id: 'ae9d3c9f-d256-4d4a-b868-f5dd4def9581',
                deployment_id: '345e1286-2c97-4b68-accf-b77e96fe1803',
                respondent_code: 'RESP-0001',
                answers_json: {
                    Q001: 'Rodriguez',
                    Q002: 'San Jose',
                    Q003: 'Yes'
                },
                metadata_json: {
                    source: 'API Test',
                    device: 'Test Device'
                }
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateResponse();