const pool = require('../config/database');

// 📋 Admin: Get all surveys with full control view
exports.getAllSurveysAdmin = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                s.*,
                COUNT(q.question_id) AS total_questions
            FROM surveys s
            LEFT JOIN questions q
                ON s.survey_id = q.survey_id
            GROUP BY s.survey_id
            ORDER BY s.created_at DESC
        `);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

// 📊 Admin: Get single survey details
exports.getSurveyDetailsAdmin = async (req, res) => {
    try {
        const survey = await pool.query(
            `SELECT * FROM surveys WHERE survey_id = $1`,
            [req.params.id]
        );

        const questions = await pool.query(
            `SELECT * FROM questions WHERE survey_id = $1`,
            [req.params.id]
        );

        if (survey.rows.length === 0) {
            return res.status(404).json({
                error: 'Survey not found'
            });
        }

        res.json({
            success: true,
            survey: survey.rows[0],
            questions: questions.rows
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

// 🛠️ Admin: Update survey status (activate/deactivate)
exports.updateSurveyStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const result = await pool.query(
            `UPDATE surveys
             SET status = $1,
                 updated_at = NOW()
             WHERE survey_id = $2
             RETURNING *`,
            [status, req.params.id]
        );

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};