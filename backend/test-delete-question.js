const axios = require('axios');

async function testDeleteQuestion() {
    try {
        const response = await axios.delete(
            'http://localhost:5050/api/question-bank/5ff58bf3-4967-46c9-9400-4d27821ba42e'
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testDeleteQuestion();