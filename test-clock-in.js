const axios = require('axios');

async function testClockIn() {
    console.log('TEST STARTED');

    try {
        const response = await axios.post(
            'http://localhost:5050/api/attendance/clock-in',
            {
                enumerator_id: '9a53e104-2da2-4950-95dd-1c071290a7be',
                deployment_id: 'b8b0876a-ee94-4b23-8963-8f3b08a1b426',
                device_id: '6d2d914b-144e-463b-9cce-fbe0f86c312a',
                clock_in_gps: {
                    lat: 14.731,
                    lng: 121.144
                }
            }
        );

        console.log(response.data);
    } catch (err) {
        console.error(err.response?.data || err.message);
    }
}

testClockIn();