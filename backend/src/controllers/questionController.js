const pool = require('../config/database');

exports.getAllQuestions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT *
            FROM questions
            ORDER BY created_at DESC
        `);

        res.json(result.rows);
    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const {
            survey_id,
            question_text,
            question_type,
            choices
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO questions
            (
                survey_id,
                question_text,
                question_type,
                choices,
                created_at
            )
            VALUES
            ($1,$2,$3,$4,NOW())
            RETURNING *
            `,
            [
                survey_id,
                question_text,
                question_type,
                choices
            ]
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

exports.deleteQuestion = async (req, res) => {
    try {
        const result = await pool.query(
            `
            DELETE FROM questions
            WHERE question_id = $1
            RETURNING *
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Question not found'
            });
        }

        res.json({
            success: true,
            deleted: result.rows[0]
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};