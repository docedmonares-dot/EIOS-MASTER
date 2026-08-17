const pool = require('../config/database');

exports.clockIn = async (req, res) => {
    try {
        const {
            enumerator_id,
            deployment_id,
            device_id,
            clock_in_gps
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO enumerator_attendance
            (
                enumerator_id,
                deployment_id,
                device_id,
                clock_in_time,
                clock_in_gps,
                attendance_status
            )
            VALUES
            ($1,$2,$3,NOW(),ST_SetSRID(ST_MakePoint($4, $5), 4326),'Clocked-In')
            RETURNING *
            `,
            [
                enumerator_id,
                deployment_id,
                device_id,
                clock_in_gps.lng,
                clock_in_gps.lat
            ]
        );

        // REAL-TIME EMIT (OUTSIDE SQL)
        const io = req.app.get('io');

        io.emit('attendance:clock-in', {
            type: 'CLOCK_IN',
            data: result.rows[0]
        });

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.clockOut = async (req, res) => {
    try {
        const {
            attendance_id,
            clock_out_gps
        } = req.body;

        const result = await pool.query(
            `
          const io = req.app.get('io');

io.emit('attendance:clock-out', {
    type: 'CLOCK_OUT',
    data: result.rows[0]
});  
            UPDATE enumerator_attendance
            SET
                clock_out_time = NOW(),
                clock_out_gps = ST_SetSRID(ST_MakePoint($1, $2), 4326),
                attendance_status = 'Clocked-Out'
            WHERE attendance_id = $3
            RETURNING *
            `,
            [
                clock_out_gps.lng,
                clock_out_gps.lat,
                attendance_id
            ]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};