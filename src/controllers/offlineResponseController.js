const pool = require('../config/database');

exports.getAllOfflineResponses = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM offline_response_queue
            ORDER BY created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};

exports.createOfflineResponse = async (req, res) => {
    try {
        const {
            local_response_id,
            local_device_id,
            enumerator_id,
            deployment_id,
            survey_version_id,
            respondent_code,
            answers_json,
            gps_json,
            qc_precheck_json
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO offline_response_queue
            (
                local_response_id,
                local_device_id,
                enumerator_id,
                deployment_id,
                survey_version_id,
                respondent_code,
                answers_json,
                gps_json,
                qc_precheck_json,
                sync_status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6,$7,$8,$9,'Draft')
            RETURNING *
            `,
            [
                local_response_id,
                local_device_id,
                enumerator_id,
                deployment_id,
                survey_version_id,
                respondent_code,
                JSON.stringify(answers_json),
                JSON.stringify(gps_json),
                JSON.stringify(qc_precheck_json)
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
exports.syncOfflineResponse = async (req, res) => {
    try {
        const offlineResult = await pool.query(
            `
            SELECT *
            FROM offline_response_queue
            WHERE offline_response_id = $1
            `,
            [req.params.id]
        );

        if (offlineResult.rows.length === 0) {
            return res.status(404).json({
                error: 'Offline response not found'
            });
        }

        const offline = offlineResult.rows[0];

      const responseResult = await pool.query(
    `
    INSERT INTO survey_responses
    (
        survey_id,
        survey_version_id,
        deployment_id,
        enumerator_id,
        respondent_code,
        answers_json,
        metadata_json
    )
    VALUES
    (
        (SELECT survey_id FROM survey_versions WHERE survey_version_id = $1),
        $1,
        $2,
        $3,
        $4,
        $5,
        $6
    )
    RETURNING *
    `,
    [
        offline.survey_version_id,
        offline.deployment_id,
        offline.enumerator_id,
        offline.respondent_code,
        JSON.stringify(offline.answers_json),
        JSON.stringify({
            source: 'Offline Sync',
            local_response_id: offline.local_response_id,
            local_device_id: offline.local_device_id,
            gps: offline.gps_json,
            qc_precheck: offline.qc_precheck_json
        })
    ]
);  

        const updateResult = await pool.query(
            `
            UPDATE offline_response_queue
            SET
                sync_status = 'Synced',
                synced_at = NOW(),
                updated_at = NOW()
            WHERE offline_response_id = $1
            RETURNING *
            `,
            [req.params.id]
        );

        res.json({
            success: true,
            message: 'Offline response synced successfully',
            synced_response: responseResult.rows[0],
            offline_queue: updateResult.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};