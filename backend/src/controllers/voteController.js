const pool = require('../config/database');

// 🗳️ Submit Vote
exports.submitVote = async (req, res) => {
    try {
        const {
            election_id,
            voter_code,
            candidate_id,
            precinct_id
        } = req.body;

        // ❗ Prevent duplicate voting
        const existing = await pool.query(
            `SELECT * FROM votes WHERE voter_code = $1 AND election_id = $2`,
            [voter_code, election_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({
                message: 'Voter has already voted'
            });
        }

        const result = await pool.query(
            `
            INSERT INTO votes
            (
                election_id,
                voter_code,
                candidate_id,
                precinct_id,
                created_at
            )
            VALUES
            ($1,$2,$3,$4,NOW())
            RETURNING *
            `,
            [
                election_id,
                voter_code,
                candidate_id,
                precinct_id
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

// 📊 Get Results
exports.getResults = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                candidate_id,
                COUNT(*) as total_votes
            FROM votes
            WHERE election_id = $1
            GROUP BY candidate_id
            ORDER BY total_votes DESC
        `, [req.params.election_id]);

        res.json(result.rows);

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};