const axios = require('axios');

async function testAssignPersonnel() {
    console.log('TEST STARTED');

    try {
        const response = await axios.post(
            'http://localhost:5050/api/deployment-personnel',
            {
                deployment_id: 'b8b0876a-ee94-4b23-8963-8f3b08a1b426',
                personnel_id: '9a53e104-2da2-4950-95dd-1c071290a7be',
                assignment_role: 'Enumerator'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testAssignPersonnel();