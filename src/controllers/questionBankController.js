const pool = require('../config/database');

exports.getAllQuestions = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                q.*,
                c.category_name,
                c.category_code
            FROM question_bank q
            LEFT JOIN question_categories c
                ON q.question_category_id = c.category_id
            ORDER BY q.question_code
        `);

        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};

exports.getQuestionById = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                q.*,
                c.category_name,
                c.category_code
            FROM question_bank q
            LEFT JOIN question_categories c
                ON q.question_category_id = c.category_id
            WHERE q.question_id = $1
            `,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                error: 'Question not found'
            });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const {
            question_code,
            question_text,
            question_type,
            question_group,
            question_module,
            question_status
        } = req.body;

        const result = await pool.query(
            `
            INSERT INTO question_bank
            (
                question_code,
                question_text,
                question_type,
                question_group,
                question_module,
                question_status
            )
            VALUES
            ($1,$2,$3,$4,$5,$6)
            RETURNING *
            `,
            [
                question_code,
                question_text,
                question_type,
                question_group,
                question_module,
                question_status
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
exports.updateQuestion = async (req, res) => {
    try {

        const {
            question_text,
            question_type,
            question_group,
            question_module,
            question_status
        } = req.body;

        const result = await pool.query(
            `
            UPDATE question_bank
            SET
                question_text = $1,
                question_type = $2,
                question_group = $3,
                question_module = $4,
                question_status = $5
            WHERE question_id = $6
            RETURNING *
            `,
            [
                question_text,
                question_type,
                question_group,
                question_module,
                question_status,
                req.params.id
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
console.log('QUESTION BANK CONTROLLER LOADED');
exports.deleteQuestion = async (req, res) => {
    try {
        const result = await pool.query(
            `
            DELETE FROM question_bank
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
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};