console.log('TEST STARTED');
const axios = require('axios');

async function testCreateQuestion() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/question-bank',
            {
                question_code: 'Q004',
                question_text: 'Sex',
                question_type: 'Single Choice',
                question_group: 'Respondent Profile',
                question_module: 'Survey',
                question_status: 'Active'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateQuestion();