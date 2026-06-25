const pool = require('../config/database');

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

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
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

        const versionResult = await pool.query(
            `
            SELECT *
            FROM survey_versions
            WHERE survey_version_id = $1
            `,
            [survey_version_id]
        );

        if (versionResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey version not found'
            });
        }

        const deploymentPackage = {
            version: versionResult.rows[0].version_number,
            version_label: versionResult.rows[0].version_label,
            survey_snapshot: versionResult.rows[0].survey_snapshot,
            question_snapshot: versionResult.rows[0].question_snapshot,
            logic_snapshot: versionResult.rows[0].logic_snapshot
        };

        const result = await pool.query(
            `
            INSERT INTO survey_deployments
            (
                survey_id,
                survey_version_id,
                deployment_package,
                deployment_status
            )
            VALUES
            ($1,$2,$3,$4)
            RETURNING *
            `,
            [
                survey_id,
                survey_version_id,
                JSON.stringify(deploymentPackage),
                deployment_status
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