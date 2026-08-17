const pool = require("../config/database");

exports.getExecutiveDashboard = async (req, res) => {
  try {
    const enumerators = await pool.query(`
      SELECT COUNT(*) 
      FROM deployment_personnel
    `);

    const deployments = await pool.query(`
      SELECT COUNT(*) 
      FROM deployments
    `);

    const attendance = await pool.query(`
      SELECT COUNT(*)
      FROM enumerator_attendance
      WHERE DATE(clock_in_time) = CURRENT_DATE
    `);

    const active = await pool.query(`
      SELECT COUNT(*)
      FROM enumerator_attendance
      WHERE attendance_status = 'Clocked-In'
    `);

    const kpi = await pool.query(`
      SELECT
        AVG(
          EXTRACT(
            EPOCH FROM (clock_out_time - clock_in_time)
          ) / 3600
        ) AS avg_hours
      FROM enumerator_attendance
      WHERE clock_out_time IS NOT NULL
    `);

    res.json({
      success: true,
      message: "EIOS Executive Dashboard v1",
      data: {
        total_enumerators: Number(
          enumerators.rows[0].count
        ),
        total_deployments: Number(
          deployments.rows[0].count
        ),
        today_attendance: Number(
          attendance.rows[0].count
        ),
        active_enumerators: Number(
          active.rows[0].count
        ),
        average_hours: Number(
          kpi.rows[0].avg_hours || 0
        ),
      },
    });
  } catch (error) {
    console.error(
      "DASHBOARD ERROR:",
      error.message
    );

    res.status(500).json({
      success: false,
      message: "Unable to load dashboard data",
      error: error.message,
    });
  }
};