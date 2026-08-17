const axios = require('axios');

async function testCreateEnumerator() {
    console.log('TEST STARTED');
    try {
        const response = await axios.post(
            'http://localhost:5050/api/enumerators',
            {
                full_name: 'Juan Dela Cruz',
                role: 'Enumerator',
                mobile_number: '09171234567',
                email: 'juan.enumerator@test.com',
                team_name: 'Team Alpha',
                status: 'Active'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testCreateEnumerator();