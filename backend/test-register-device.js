const axios = require('axios');

async function testRegisterDevice() {
    console.log('TEST STARTED');

    try {
        const response = await axios.post(
            'http://localhost:5050/api/enumerator-devices',
            {
                personnel_id: '9a53e104-2da2-4950-95dd-1c071290a7be',
                device_name: 'Juan Phone',
                device_fingerprint: 'DEVICE-FINGERPRINT-001',
                platform: 'Android',
                browser: 'Chrome',
                os_version: 'Android 14',
                status: 'Pending'
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testRegisterDevice();