const pool = require("../config/database");

exports.getAllDeployments = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sd.*,
                s.survey_code,
                s.survey_name,
                sv.version_number,
                sv.version_label
            FROM survey_deployments sd
            LEFT JOIN surveys s
                ON sd.survey_id = s.survey_id
            LEFT JOIN survey_versions sv
                ON sd.survey_version_id = sv.survey_version_id
            ORDER BY sd.deployed_at DESC
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

exports.getDeploymentById = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                sd.*,
                s.survey_code,
                s.survey_name,
                sv.version_number,
                sv.version_label
            FROM survey_deployments sd
            LEFT JOIN surveys s
                ON sd.survey_id = s.survey_id
            LEFT JOIN survey_versions sv
                ON sd.survey_version_id = sv.survey_version_id
            WHERE sd.deployment_id = $1
            LIMIT 1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Survey deployment not found."
            });
        }

        return res.json({
            success: true,
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

exports.createDeployment = async (req, res) => {
    try {
        const {
            survey_id,
            survey_version_id,
            deployment_status
        } = req.body;

        if (
            !survey_id ||
            !survey_version_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "survey_id and survey_version_id are required."
            });
        }

        const versionResult =
            await pool.query(
                `
                SELECT *
                FROM survey_versions
                WHERE survey_version_id = $1
                `,
                [survey_version_id]
            );

        if (
            versionResult.rows.length === 0
        ) {
            return res.status(404).json({
                success: false,
                message:
                    "Survey version not found."
            });
        }

        const version =
            versionResult.rows[0];

        if (
            version.survey_id !==
            survey_id
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Survey version does not belong to the selected survey."
            });
        }

        const existingResult = await pool.query(
            `
            SELECT *
            FROM survey_deployments
            WHERE survey_id = $1
              AND survey_version_id = $2
              AND deployment_status IN ('Ready', 'Deployed', 'Paused')
            ORDER BY deployed_at DESC
            LIMIT 1
            `,
            [survey_id, survey_version_id]
        );

        if (existingResult.rows.length > 0) {
            return res.json({
                success: true,
                reused: true,
                message: "Existing survey deployment package reused.",
                data: existingResult.rows[0]
            });
        }

        const deploymentPackage = {
            package_format:
                "EIOS_COMPILED_FORM",

            package_format_version:
                "1.0.0",

            version:
                version.version_number,

            version_label:
                version.version_label,

            survey_snapshot:
                version.survey_snapshot,

            question_snapshot:
                version.question_snapshot,

            logic_snapshot:
                version.logic_snapshot
        };

        const result =
            await pool.query(
                `
                INSERT INTO survey_deployments
                (
                    survey_id,
                    survey_version_id,
                    deployment_package,
                    deployment_status
                )
                VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4
                )
                RETURNING *
                `,
                [
                    survey_id,
                    survey_version_id,
                    JSON.stringify(
                        deploymentPackage
                    ),
                    deployment_status ||
                        "Ready"
                ]
            );

        return res.status(201).json({
            success: true,
            message:
                "Survey deployment created successfully.",
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

exports.assignDeploymentToEnumerator = async (req, res) => {
    const client = await pool.connect();

    try {
        const packageDeploymentId = req.params.id;
        const { personnel_id } = req.body;

        if (!personnel_id) {
            return res.status(400).json({
                success: false,
                message: "personnel_id is required."
            });
        }

        await client.query("BEGIN");

        const packageResult = await client.query(
            `SELECT * FROM survey_deployments WHERE deployment_id = $1`,
            [packageDeploymentId]
        );
        const personnelResult = await client.query(
            `
            SELECT personnel_id, full_name
            FROM personnel
            WHERE personnel_id = $1
              AND role = 'Enumerator'
              AND status = 'Active'
            `,
            [personnel_id]
        );

        if (packageResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Survey deployment package was not found."
            });
        }

        if (personnelResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return res.status(404).json({
                success: false,
                message: "Active Enumerator was not found."
            });
        }

        const packageRecord = packageResult.rows[0];
        const personnel = personnelResult.rows[0];
        const existingAssignmentResult = await client.query(
            `
            SELECT
                deployment.deployment_id,
                assignment.deployment_personnel_id
            FROM deployments AS deployment
            JOIN deployment_personnel AS assignment
              ON assignment.deployment_id = deployment.deployment_id
            WHERE deployment.survey_id = $1
              AND deployment.survey_version_id = $2
              AND assignment.personnel_id = $3
              AND assignment.status IN ('Assigned', 'Active', 'Paused')
              AND deployment.deployment_status IN ('Ready', 'Active', 'Paused')
            ORDER BY assignment.assigned_at DESC
            LIMIT 1
            `,
            [
                packageRecord.survey_id,
                packageRecord.survey_version_id,
                personnel_id
            ]
        );

        if (existingAssignmentResult.rows.length > 0) {
            await client.query("COMMIT");
            return res.json({
                success: true,
                reused: true,
                message: "Existing Enumerator assignment reused.",
                data: {
                    package_deployment_id: packageDeploymentId,
                    operational_deployment_id:
                        existingAssignmentResult.rows[0].deployment_id,
                    personnel_id,
                    personnel_name: personnel.full_name
                }
            });
        }

        const deploymentResult = await client.query(
            `
            INSERT INTO deployments (
                survey_id,
                survey_version_id,
                deployment_name,
                deployment_status
            )
            VALUES ($1, $2, $3, 'Ready')
            RETURNING *
            `,
            [
                packageRecord.survey_id,
                packageRecord.survey_version_id,
                `Survey Field Deployment - ${personnel.full_name}`,
            ]
        );

        await client.query(
            `
            INSERT INTO deployment_personnel (
                deployment_id,
                personnel_id,
                deployment_role,
                status
            )
            VALUES ($1, $2, 'Enumerator', 'Assigned')
            `,
            [deploymentResult.rows[0].deployment_id, personnel_id]
        );

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message: "Survey package assigned to Enumerator successfully.",
            data: {
                package_deployment_id: packageDeploymentId,
                operational_deployment_id:
                    deploymentResult.rows[0].deployment_id,
                personnel_id,
                personnel_name: personnel.full_name,
            }
        });
    } catch (error) {
        console.error(
            "ASSIGN SURVEY DEPLOYMENT ERROR:",
            error
        );
        await client.query("ROLLBACK");
        return res.status(500).json({
            success: false,
            message: "Unable to assign the survey deployment.",
            error: error.message
        });
    } finally {
        client.release();
    }
};
