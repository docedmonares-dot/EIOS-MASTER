const pool = require("../config/database");

/* =========================================================
   JOB MANAGER SUMMARY
========================================================= */

exports.getJobSummary = async (req, res) => {
    try {
        const statusResult = await pool.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE job_status IN (
                        'Claimed',
                        'Validating',
                        'Processing',
                        'Retrying'
                    )
                )::INTEGER AS running_jobs,

                COUNT(*) FILTER (
                    WHERE job_status IN (
                        'Queued',
                        'Scheduled',
                        'Waiting'
                    )
                )::INTEGER AS queued_jobs,

                COUNT(*) FILTER (
                    WHERE job_status IN (
                        'Completed',
                        'Completed With Errors'
                    )
                    AND completed_at::DATE = CURRENT_DATE
                )::INTEGER AS completed_today,

                COUNT(*) FILTER (
                    WHERE job_status IN (
                        'Failed',
                        'Timed Out'
                    )
                )::INTEGER AS failed_jobs,

                COUNT(*)::INTEGER AS total_jobs
            FROM enterprise_jobs
        `);

        const workersResult = await pool.query(`
            SELECT
                COUNT(*) FILTER (
                    WHERE worker_status IN (
                        'Online',
                        'Busy'
                    )
                )::INTEGER AS active_workers,

                COUNT(*) FILTER (
                    WHERE worker_status = 'Unhealthy'
                )::INTEGER AS unhealthy_workers,

                COUNT(*)::INTEGER AS total_workers
            FROM enterprise_job_workers
        `);

        const typesResult = await pool.query(`
            SELECT COUNT(*)::INTEGER AS active_job_types
            FROM enterprise_job_types
            WHERE is_active = TRUE
        `);

        return res.json({
            success: true,
            data: {
                running_jobs:
                    statusResult.rows[0]?.running_jobs || 0,

                queued_jobs:
                    statusResult.rows[0]?.queued_jobs || 0,

                completed_today:
                    statusResult.rows[0]?.completed_today || 0,

                failed_jobs:
                    statusResult.rows[0]?.failed_jobs || 0,

                total_jobs:
                    statusResult.rows[0]?.total_jobs || 0,

                active_workers:
                    workersResult.rows[0]?.active_workers || 0,

                unhealthy_workers:
                    workersResult.rows[0]?.unhealthy_workers || 0,

                total_workers:
                    workersResult.rows[0]?.total_workers || 0,

                active_job_types:
                    typesResult.rows[0]?.active_job_types || 0,

                executive_integration: "Connected"
            }
        });
    } catch (error) {
        console.error(
            "GET ENTERPRISE JOB SUMMARY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load enterprise job summary.",
            error: error.message
        });
    }
};

/* =========================================================
   JOB TYPES
========================================================= */

exports.getJobTypes = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                job_type_id,
                job_type_code,
                job_type_name,
                job_category,
                description,
                default_priority,
                default_max_attempts,
                default_timeout_seconds,
                supports_progress,
                supports_cancellation,
                supports_retry,
                handler_name,
                is_system_type,
                is_active
            FROM enterprise_job_types
            WHERE is_active = TRUE
            ORDER BY job_category, job_type_name
        `);

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET ENTERPRISE JOB TYPES ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load enterprise job types.",
            error: error.message
        });
    }
};

/* =========================================================
   RECENT JOBS
========================================================= */

exports.getRecentJobs = async (req, res) => {
    try {
        const requestedLimit = Number(req.query.limit);
        const limit = Number.isInteger(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 100)
            : 20;

        const result = await pool.query(
            `
            SELECT
                job.enterprise_job_id,
                job.job_name,
                job.job_description,
                job.job_status,
                job.priority,
                job.progress_percentage,
                job.progress_message,
                job.current_attempt,
                job.max_attempts,
                job.queue_name,
                job.requested_by,
                job.queued_at,
                job.started_at,
                job.completed_at,
                job.created_at,

                type.job_type_code,
                type.job_type_name,
                type.job_category
            FROM enterprise_jobs AS job
            JOIN enterprise_job_types AS type
                ON type.job_type_id = job.job_type_id
            ORDER BY job.created_at DESC
            LIMIT $1
            `,
            [limit]
        );

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET RECENT ENTERPRISE JOBS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load recent enterprise jobs.",
            error: error.message
        });
    }
};

/* =========================================================
   CREATE CONTROLLED TEST JOB
========================================================= */

exports.createTestJob = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const jobTypeResult = await client.query(`
            SELECT
                job_type_id,
                default_priority,
                default_max_attempts,
                default_timeout_seconds
            FROM enterprise_job_types
            WHERE job_type_code = 'ENTERPRISE_IMPORT'
              AND is_active = TRUE
            LIMIT 1
        `);

        if (jobTypeResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "The ENTERPRISE_IMPORT job type was not found."
            });
        }

        const jobType = jobTypeResult.rows[0];

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const jobResult = await client.query(
            `
            INSERT INTO enterprise_jobs (
                job_type_id,
                requested_by,
                job_name,
                job_description,
                job_status,
                priority,
                progress_percentage,
                progress_message,
                max_attempts,
                timeout_seconds,
                queue_name,
                input_payload_json
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                'Queued',
                $5,
                0,
                'Waiting for an available worker.',
                $6,
                $7,
                'default',
                $8::jsonb
            )
            RETURNING
                enterprise_job_id,
                job_name,
                job_description,
                job_status,
                priority,
                progress_percentage,
                progress_message,
                max_attempts,
                timeout_seconds,
                queue_name,
                queued_at,
                created_at
            `,
            [
                jobType.job_type_id,
                requestedBy,
                "PGIE Test Import Job",
                "Controlled test job created to verify Enterprise Job Manager integration.",
                jobType.default_priority,
                jobType.default_max_attempts,
                jobType.default_timeout_seconds,
                JSON.stringify({
                    test_mode: true,
                    source_module: "PGIE",
                    target_entity: "geo_units"
                })
            ]
        );

        const createdJob = jobResult.rows[0];

        await client.query(
            `
            INSERT INTO enterprise_job_events (
                enterprise_job_id,
                event_type,
                event_level,
                event_message,
                event_data_json,
                created_by
            )
            VALUES (
                $1,
                'JOB_CREATED',
                'Information',
                'Controlled enterprise test job was created.',
                $2::jsonb,
                $3
            )
            `,
            [
                createdJob.enterprise_job_id,
                JSON.stringify({
                    source: "Enterprise Job Manager test endpoint",
                    test_mode: true
                }),
                requestedBy
            ]
        );

        await client.query("COMMIT");

        const io = req.app.get("io");

        if (io) {
            io.emit("enterprise-job-created", createdJob);
            io.emit("enterprise-job-summary-refresh");
        }

        return res.status(201).json({
            success: true,
            message: "Test enterprise job created successfully.",
            data: createdJob
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "CREATE ENTERPRISE TEST JOB ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create the test enterprise job.",
            error: error.message
        });
    } finally {
        client.release();
    }
};

/* =========================================================
   CREATE CONTROLLED TEST JOB
========================================================= */

exports.createTestJob = async (req, res) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const jobTypeResult = await client.query(`
            SELECT
                job_type_id,
                default_priority,
                default_max_attempts,
                default_timeout_seconds
            FROM enterprise_job_types
            WHERE job_type_code = 'ENTERPRISE_IMPORT'
              AND is_active = TRUE
            LIMIT 1
        `);

        if (jobTypeResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "The ENTERPRISE_IMPORT job type was not found."
            });
        }

        const jobType = jobTypeResult.rows[0];

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        const jobResult = await client.query(
            `
            INSERT INTO enterprise_jobs (
                job_type_id,
                requested_by,
                job_name,
                job_description,
                job_status,
                priority,
                progress_percentage,
                progress_message,
                max_attempts,
                timeout_seconds,
                queue_name,
                input_payload_json
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                'Queued',
                $5,
                0,
                'Waiting for an available worker.',
                $6,
                $7,
                'default',
                $8::jsonb
            )
            RETURNING
                enterprise_job_id,
                job_name,
                job_description,
                job_status,
                priority,
                progress_percentage,
                progress_message,
                max_attempts,
                timeout_seconds,
                queue_name,
                queued_at,
                created_at
            `,
            [
                jobType.job_type_id,
                requestedBy,
                "PGIE Test Import Job",
                "Controlled test job created to verify Enterprise Job Manager integration.",
                jobType.default_priority,
                jobType.default_max_attempts,
                jobType.default_timeout_seconds,
                JSON.stringify({
                    test_mode: true,
                    source_module: "PGIE",
                    target_entity: "geo_units"
                })
            ]
        );

        const createdJob = jobResult.rows[0];

        await client.query(
            `
            INSERT INTO enterprise_job_events (
                enterprise_job_id,
                event_type,
                event_level,
                event_message,
                event_data_json,
                created_by
            )
            VALUES (
                $1,
                'JOB_CREATED',
                'Information',
                'Controlled enterprise test job was created.',
                $2::jsonb,
                $3
            )
            `,
            [
                createdJob.enterprise_job_id,
                JSON.stringify({
                    source: "Enterprise Job Manager test endpoint",
                    test_mode: true
                }),
                requestedBy
            ]
        );

        await client.query("COMMIT");

        const io = req.app.get("io");

        if (io) {
            io.emit("enterprise-job-created", createdJob);
            io.emit("enterprise-job-summary-refresh");
        }

        return res.status(201).json({
            success: true,
            message: "Test enterprise job created successfully.",
            data: createdJob
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "CREATE ENTERPRISE TEST JOB ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to create the test enterprise job.",
            error: error.message
        });
    } finally {
        client.release();
    }
};