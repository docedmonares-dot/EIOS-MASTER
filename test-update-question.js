const axios = require('axios');

async function testUpdateQuestion() {
    try {
        const response = await axios.put(
            'http://localhost:5050/api/question-bank/5ff58bf3-4967-46c9-9400-4d27821ba42e',
            {
                question_text: 'Sex / Gender',
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

testUpdateQuestion();