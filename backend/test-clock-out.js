const axios = require('axios');

async function testClockOut() {
    console.log('TEST STARTED');

    try {
        const response = await axios.post(
            'http://localhost:5050/api/attendance/clock-out',
            {
                attendance_id: '541ccbc6-bb47-4d40-b5f0-647a315b3f9a',
                clock_out_gps: {
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

testClockOut();