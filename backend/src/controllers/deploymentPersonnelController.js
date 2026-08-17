const pool = require("../config/database");

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

        return res.json(result.rows);
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.getMyAssignments = async (req, res) => {
    try {
        const userId =
            req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message:
                    "Authenticated user identity is required."
            });
        }

        const personnelResult =
            await pool.query(
                `
                SELECT
                    personnel_id,
                    user_id,
                    full_name,
                    role,
                    status,
                    team_name
                FROM personnel
                WHERE user_id = $1
                LIMIT 1
                `,
                [userId]
            );

        if (
            personnelResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "No personnel record is linked to this user account."
            });
        }

        const personnel =
            personnelResult.rows[0];

        const assignmentsResult =
            await pool.query(
                `
                SELECT
                    dp.deployment_personnel_id,
                    dp.personnel_id,
                    dp.deployment_role,
                    dp.status AS assignment_status,
                    dp.assigned_at,

                    d.deployment_id
                        AS operational_deployment_id,

                    d.deployment_name,
                    d.survey_id,
                    d.survey_version_id,

                    d.deployment_status
                        AS operational_status,

                    sd.deployment_id
                        AS package_deployment_id,

                    sd.deployment_status
                        AS package_status,

                    sd.deployed_at
                        AS package_deployed_at,

                    sd.deployment_package

                FROM deployment_personnel dp

                INNER JOIN deployments d
                    ON d.deployment_id =
                        dp.deployment_id

                LEFT JOIN LATERAL (
                    SELECT
                        sd_inner.*
                    FROM survey_deployments
                        sd_inner
                    WHERE
                        sd_inner.survey_id =
                            d.survey_id
                        AND
                        sd_inner.survey_version_id =
                            d.survey_version_id
                    ORDER BY
                        sd_inner.deployed_at DESC
                    LIMIT 1
                ) sd
                    ON true

                WHERE
                    dp.personnel_id = $1
                    AND dp.status = 'Assigned'

                ORDER BY
                    dp.assigned_at DESC
                `,
                [
                    personnel.personnel_id
                ]
            );

        return res.json({
            success: true,

            personnel: {
                personnel_id:
                    personnel.personnel_id,

                user_id:
                    personnel.user_id,

                full_name:
                    personnel.full_name,

                role:
                    personnel.role,

                status:
                    personnel.status,

                team_name:
                    personnel.team_name
            },

            assignments:
                assignmentsResult.rows
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
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

        if (
            !deployment_id ||
            !personnel_id ||
            !assignment_role
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "deployment_id, personnel_id, and assignment_role are required."
            });
        }

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
            (
                $1,
                $2,
                $3,
                'Assigned'
            )
            RETURNING *
            `,
            [
                deployment_id,
                personnel_id,
                assignment_role
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Personnel assigned successfully.",
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};