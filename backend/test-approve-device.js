const axios = require('axios');

async function testApproveDevice() {
    console.log('TEST STARTED');

    try {
        const response = await axios.put(
            'http://localhost:5050/api/enumerator-devices/6d2d914b-144e-463b-9cce-fbe0f86c312a/approve'
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testApproveDevice();