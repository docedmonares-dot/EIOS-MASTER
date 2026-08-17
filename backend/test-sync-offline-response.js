const axios = require('axios');

async function testSyncOfflineResponse() {
    try {
        const response = await axios.post(
            'http://localhost:5050/api/offline-responses/sync/2482fc24-6a3f-4278-a1a0-4e8a6cb5dca0'
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testSyncOfflineResponse();