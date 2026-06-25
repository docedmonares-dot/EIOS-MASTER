const axios = require('axios');

console.log('STARTING TEST');

async function testPublishSurvey() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/survey-versions/6f0cd760-20fb-471e-801a-a1f86f51b7e6/publish'
        );

        console.log('SUCCESS');
        console.log(response.data);

    } catch (err) {

        console.log('ERROR');

        console.error(
            err.response?.data ||
            err.message ||
            err
        );
    }
}

testPublishSurvey();