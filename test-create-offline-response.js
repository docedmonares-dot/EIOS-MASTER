const axios = require('axios');

async function testCreateOfflineResponse() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/offline-responses',
            {
                local_response_id: 'LOCAL-RESP-0001',
                local_device_id: null,
                enumerator_id: null,
                deployment_id: 'b8b0876a-ee94-4b23-8963-8f3b08a1b426',
                survey_version_id: 'bcacb389-6af1-460f-83fe-6d8e378d83de',
                respondent_code: 'RESP-OFFLINE-0001',
                answers_json: {
                    Q001: 'Rodriguez',
                    Q002: 'San Jose',
                    Q003: 'Yes'
                },
                gps_json: {
                    lat: 14.731,
                    lng: 121.144,
                    accuracy: 5
                },
                qc_precheck_json: {
                    missing_answers: 0,
                    gps_valid: true
                }
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateOfflineResponse();