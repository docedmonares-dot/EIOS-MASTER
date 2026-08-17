const pool = require("../config/database");

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
            success: false,
            error: err.message
        });
    }
};

exports.getOwnOfflineResponses = async (req, res) => {
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
                    offline_response_id,
                    local_response_id,
                    local_device_id,
                    enumerator_id,
                    deployment_id,
                    survey_version_id,
                    respondent_code,
                    answers_json,
                    gps_json,
                    qc_precheck_json,
                    sync_status,
                    synced_at,
                    created_at,
                    updated_at
                FROM offline_response_queue
                WHERE enumerator_id = $1
                ORDER BY created_at DESC
                `,
                [personnelId]
            );

        return res.json({
            success: true,
            personnel_id:
                personnelId,
            total:
                result.rows.length,
            responses:
                result.rows
        });

    } catch (error) {
        console.error(
            "GET OWN OFFLINE RESPONSES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to load offline responses.",
            error:
                error.message
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
                'Draft'
            )
            RETURNING *
            `,
            [
                local_response_id,
                local_device_id || null,
                enumerator_id || null,
                deployment_id || null,
                survey_version_id || null,
                respondent_code || null,
                JSON.stringify(
                    answers_json || {}
                ),
                JSON.stringify(
                    gps_json || {}
                ),
                JSON.stringify(
                    qc_precheck_json || {}
                )
            ]
        );

        res.status(201).json({
            success: true,
            message:
                "Offline response created successfully.",
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
};

exports.syncOwnOfflineResponse = async (req, res) => {
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

        const result = await pool.query(
            `
            SELECT
                oq.offline_response_id
            FROM offline_response_queue oq

            INNER JOIN personnel p
                ON p.personnel_id =
                    oq.enumerator_id

            WHERE
                oq.offline_response_id = $1
                AND p.user_id = $2

            LIMIT 1
            `,
            [
                req.params.id,
                userId
            ]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                success: false,
                message:
                    "You are not authorized to synchronize this offline response."
            });
        }

        return exports.syncOfflineResponse(
            req,
            res
        );

    } catch (error) {
        console.error(
            "SYNC OWN OFFLINE RESPONSE ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to verify offline response ownership.",
            error:
                error.message
        });
    }
};

exports.syncOfflineResponse = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const offlineResult =
            await client.query(
                `
                SELECT *
                FROM offline_response_queue
                WHERE offline_response_id = $1
                FOR UPDATE
                `,
                [req.params.id]
            );

        if (
            offlineResult.rows.length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "Offline response not found."
            });
        }

        const offline =
            offlineResult.rows[0];

        /*
         * IDEMPOTENCY GUARD
         *
         * Once an offline response has already
         * reached Synced status, do not create
         * another central survey response.
         */
        if (
            offline.sync_status === "Synced"
        ) {
            const existingResponseResult =
                await client.query(
                    `
                    SELECT *
                    FROM survey_responses
                    WHERE metadata_json
                        ->> 'local_response_id'
                        = $1
                    ORDER BY submitted_at ASC
                    LIMIT 1
                    `,
                    [
                        offline.local_response_id
                    ]
                );

            await client.query("COMMIT");

            return res.json({
                success: true,
                already_synced: true,
                message:
                    "Offline response was already synced.",
                synced_response:
                    existingResponseResult
                        .rows[0] || null,
                offline_queue:
                    offline
            });
        }

        /*
         * SECOND IDEMPOTENCY CHECK
         *
         * This protects against historical or
         * inconsistent queue states where the
         * central response already exists but
         * the queue was not marked Synced.
         */
        const existingResponseResult =
            await client.query(
                `
                SELECT *
                FROM survey_responses
                WHERE metadata_json
                    ->> 'local_response_id'
                    = $1
                ORDER BY submitted_at ASC
                LIMIT 1
                `,
                [
                    offline.local_response_id
                ]
            );

        if (
            existingResponseResult.rows
                .length > 0
        ) {
            const updateExistingQueueResult =
                await client.query(
                    `
                    UPDATE offline_response_queue
                    SET
                        sync_status = 'Synced',
                        synced_at =
                            COALESCE(
                                synced_at,
                                NOW()
                            ),
                        updated_at = NOW()
                    WHERE offline_response_id = $1
                    RETURNING *
                    `,
                    [req.params.id]
                );

            await client.query("COMMIT");

            return res.json({
                success: true,
                already_synced: true,
                message:
                    "Central response already exists. Offline queue reconciled as Synced.",
                synced_response:
                    existingResponseResult
                        .rows[0],
                offline_queue:
                    updateExistingQueueResult
                        .rows[0]
            });
        }

        /*
         * Resolve the survey belonging to
         * the published survey version.
         */
        const surveyVersionResult =
            await client.query(
                `
                SELECT
                    survey_id
                FROM survey_versions
                WHERE survey_version_id = $1
                `,
                [
                    offline.survey_version_id
                ]
            );

        if (
            surveyVersionResult.rows
                .length === 0
        ) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    "Survey version for offline response was not found."
            });
        }

        const surveyId =
            surveyVersionResult
                .rows[0]
                .survey_id;

        /*
         * Resolve wave from deployment when
         * available.
         */
        let waveId = null;

        if (offline.deployment_id) {
            const deploymentResult =
                await client.query(
                    `
                    SELECT
                        survey_wave_id
                    FROM deployments
                    WHERE deployment_id = $1
                    `,
                    [
                        offline.deployment_id
                    ]
                );

            if (
                deploymentResult.rows
                    .length > 0
            ) {
                waveId =
                    deploymentResult
                        .rows[0]
                        .survey_wave_id ||
                    null;
            }
        }

        /*
         * Create the canonical Enterprise
         * survey response.
         */
        const responseResult =
            await client.query(
                `
                INSERT INTO survey_responses
                (
                    survey_id,
                    survey_version_id,
                    wave_id,
                    deployment_id,
                    enumerator_id,
                    respondent_code,
                    answers_json,
                    metadata_json,
                    submitted_at
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
                    NOW()
                )
                RETURNING *
                `,
                [
                    surveyId,
                    offline.survey_version_id,
                    waveId,
                    offline.deployment_id,
                    offline.enumerator_id,
                    offline.respondent_code,
                    JSON.stringify(
                        offline.answers_json ||
                        {}
                    ),
                    JSON.stringify({
                        source:
                            "Offline Sync",

                        local_response_id:
                            offline.local_response_id,

                        offline_response_id:
                            offline.offline_response_id,

                        local_device_id:
                            offline.local_device_id,

                        gps:
                            offline.gps_json ||
                            {},

                        qc_precheck:
                            offline
                                .qc_precheck_json ||
                            {}
                    })
                ]
            );

        /*
         * Mark the queue record as fully synced.
         */

        /*
         * Update Enumerator quota progress.
         *
         * This runs only after a genuinely new
         * canonical survey response has been
         * created. Idempotent sync retries return
         * earlier and therefore cannot increment
         * quota progress twice.
         */
        if (
            offline.deployment_id &&
            offline.enumerator_id
        ) {
            await client.query(
                `
                WITH target_assignment AS (
                    SELECT
                        assignment_id
                    FROM area_assignments
                    WHERE deployment_id = $1
                      AND personnel_id = $2
                      AND assignment_status IN (
                          'Assigned',
                          'In Progress'
                      )
                    ORDER BY created_at DESC
                    LIMIT 1
                    FOR UPDATE
                )
                UPDATE area_assignments aa
                SET
                    quota_completed =
                        aa.quota_completed + 1,

                    quota_remaining =
                        GREATEST(
                            aa.quota_target -
                            (
                                aa.quota_completed + 1
                            ),
                            0
                        ),

                    assignment_status =
                        CASE
                            WHEN
                                aa.quota_target > 0
                                AND
                                aa.quota_completed + 1
                                    >= aa.quota_target
                            THEN 'Completed'
                            ELSE 'In Progress'
                        END,

                    updated_at = NOW()

                FROM target_assignment ta

                WHERE
                    aa.assignment_id =
                        ta.assignment_id
                `,
                [
                    offline.deployment_id,
                    offline.enumerator_id
                ]
            );
        }

        const updateResult =
            await client.query(
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

        await client.query("COMMIT");

        return res.json({
            success: true,
            already_synced: false,
            message:
                "Offline response synced successfully.",
            synced_response:
                responseResult.rows[0],
            offline_queue:
                updateResult.rows[0]
        });
    } catch (err) {
        try {
            await client.query(
                "ROLLBACK"
            );
        } catch (rollbackError) {
            console.error(
                rollbackError
            );
        }

        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    } finally {
        client.release();
    }
};