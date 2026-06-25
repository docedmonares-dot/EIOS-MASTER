const pool = require('../config/database');

exports.getAllDeploymentPersonnel = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                dp.*,
                p.full_name,
                p.mobile_number,
                p.email,
                p.team_name
            FROM deployment_personnel dp
            LEFT JOIN personnel p
                ON dp.personnel_id = p.personnel_id
            ORDER BY dp.assigned_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};
exports.assignPersonnel = async (req, res) => {
    try {
        const {
            deployment_id,
            personnel_id,
            assignment_role
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO deployment_personnel
            (
                deployment_id,
                personnel_id,
                deployment_role,
                status
            )
            VALUES
            ($1,$2,$3,'Assigned')
            RETURNING *
            `,
            [
                deployment_id,
                personnel_id,
                assignment_role
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
exports.assignPersonnel = async (req, res) => {
    res.json({
        message: 'Assign Personnel API Ready',
        received: req.body
    });
};