const axios = require('axios');

async function testCreateDeployment() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-deployments',
            {
                survey_id: '6f0cd760-20fb-471e-801a-a1f86f51b7e6',
                survey_version_id: 'bcacb389-6af1-460f-83fe-6d8e378d83de',
                deployment_status: 'Ready'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateDeployment();