const pool = require("../config/database");

exports.getAllAreaAssignments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                aa.*,
                p.full_name AS personnel_name,
                p.team_name,
                supervisor.full_name AS supervisor_name,
                d.deployment_name
            FROM area_assignments aa
            LEFT JOIN personnel p
                ON p.personnel_id = aa.personnel_id
            LEFT JOIN personnel supervisor
                ON supervisor.personnel_id = aa.supervisor_id
            LEFT JOIN deployments d
                ON d.deployment_id = aa.deployment_id
            ORDER BY aa.created_at DESC
        `);

        return res.json({
            success: true,
            total: result.rows.length,
            assignments: result.rows
        });

    } catch (error) {
        console.error(
            "GET AREA ASSIGNMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load area assignments.",
            error:
                error.message
        });
    }
};

exports.getOwnAreaAssignments = async (req, res) => {
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
                    personnel_id
                FROM personnel
                WHERE user_id = $1
                  AND status = 'Active'
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
                    "No active personnel record is linked to this user account."
            });
        }

        const personnelId =
            personnelResult.rows[0]
                .personnel_id;

        const result =
            await pool.query(
                `
                SELECT
                    aa.*,
                    supervisor.full_name
                        AS supervisor_name,
                    d.deployment_name
                FROM area_assignments aa
                LEFT JOIN personnel supervisor
                    ON supervisor.personnel_id =
                        aa.supervisor_id
                LEFT JOIN deployments d
                    ON d.deployment_id =
                        aa.deployment_id
                WHERE aa.personnel_id = $1
                ORDER BY aa.created_at DESC
                `,
                [personnelId]
            );

        return res.json({
            success: true,
            personnel_id:
                personnelId,
            total:
                result.rows.length,
            assignments:
                result.rows
        });

    } catch (error) {
        console.error(
            "GET OWN AREA ASSIGNMENTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load your area assignments.",
            error:
                error.message
        });
    }
};

exports.createAreaAssignment = async (req, res) => {
    try {
        const {
            deployment_id,
            personnel_id,
            supervisor_id,
            area_id,
            region,
            province,
            municipality,
            barangay,
            district,
            precinct_cluster,
            voting_center,
            quota_target,
            start_date,
            end_date
        } = req.body;

        if (
            !deployment_id ||
            !personnel_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "deployment_id and personnel_id are required."
            });
        }

        const normalizedTarget =
            Number.isFinite(
                Number(quota_target)
            )
                ? Math.max(
                    0,
                    Number(quota_target)
                )
                : 0;

        const result = await pool.query(
            `
            INSERT INTO area_assignments
            (
                deployment_id,
                personnel_id,
                supervisor_id,
                area_id,
                region,
                province,
                municipality,
                barangay,
                district,
                precinct_cluster,
                voting_center,
                quota_target,
                quota_completed,
                quota_remaining,
                assignment_status,
                start_date,
                end_date,
                created_by
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                0,
                $12,
                'Assigned',
                $13,
                $14,
                $15
            )
            RETURNING *
            `,
            [
                deployment_id,
                personnel_id,
                supervisor_id || null,
                area_id || null,
                region || null,
                province || null,
                municipality || null,
                barangay || null,
                district || null,
                precinct_cluster || null,
                voting_center || null,
                normalizedTarget,
                start_date || null,
                end_date || null,
                req.user?.user_id || null
            ]
        );

        return res.status(201).json({
            success: true,
            message:
                "Area assignment created successfully.",
            data:
                result.rows[0]
        });

    } catch (error) {
        console.error(
            "CREATE AREA ASSIGNMENT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create area assignment.",
            error:
                error.message
        });
    }
};