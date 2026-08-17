const pool = require("../config/database");

exports.getValidations = async (req, res) => {
    try {
        const status = String(req.query.status || "").trim();
        const result = await pool.query(
            `
            SELECT
                log.gps_validation_id,
                log.local_response_id,
                log.gps_accuracy,
                log.inside_assigned_area,
                log.gps_accuracy_passed,
                log.distance_from_area,
                log.gps_validation_status,
                log.gps_validation_flags,
                log.review_status,
                log.review_justification,
                log.reviewed_at,
                log.created_at,
                personnel.full_name AS enumerator_name,
                deployment.deployment_name,
                assignment.region,
                assignment.province,
                assignment.municipality,
                assignment.barangay,
                reviewer.full_name AS reviewed_by_name
            FROM gps_validation_logs log
            LEFT JOIN personnel
                ON personnel.personnel_id = log.personnel_id
            LEFT JOIN deployments deployment
                ON deployment.deployment_id = log.deployment_id
            LEFT JOIN area_assignments assignment
                ON assignment.assignment_id = log.assignment_id
            LEFT JOIN users reviewer
                ON reviewer.user_id = log.reviewed_by
            WHERE ($1 = '' OR log.review_status = $1)
            ORDER BY
                CASE log.review_status WHEN 'Pending' THEN 0 ELSE 1 END,
                log.created_at DESC
            LIMIT 500
            `,
            [status]
        );

        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error("GPS VALIDATION LIST ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to load GPS validation records." });
    }
};

exports.reviewValidation = async (req, res) => {
    try {
        const reviewStatus = String(req.body?.review_status || "").trim();
        const justification = String(req.body?.justification || "").trim();

        if (!["Accepted", "Rejected"].includes(reviewStatus)) {
            return res.status(400).json({ success: false, message: "Review status must be Accepted or Rejected." });
        }
        if (justification.length < 10) {
            return res.status(400).json({ success: false, message: "Provide a review justification of at least 10 characters." });
        }

        const result = await pool.query(
            `
            UPDATE gps_validation_logs
            SET review_status = $1,
                review_justification = $2,
                reviewed_by = $3,
                reviewed_at = NOW()
            WHERE gps_validation_id = $4
            RETURNING *
            `,
            [reviewStatus, justification, req.user.user_id, req.params.id]
        );

        if (!result.rows.length) {
            return res.status(404).json({ success: false, message: "GPS validation record was not found." });
        }

        return res.json({ success: true, message: "GPS exception review saved.", data: result.rows[0] });
    } catch (error) {
        console.error("GPS VALIDATION REVIEW ERROR:", error);
        return res.status(500).json({ success: false, message: "Unable to save the GPS exception review." });
    }
};
