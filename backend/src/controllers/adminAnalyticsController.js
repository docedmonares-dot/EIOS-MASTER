const pool = require('../config/database');

// 📊 Admin: Overall System Analytics
exports.getSystemAnalytics = async (req, res) => {
    try {

        const surveys = await pool.query(`SELECT COUNT(*) FROM surveys`);
        const users = await pool.query(`SELECT COUNT(*) FROM users`);
        const responses = await pool.query(`SELECT COUNT(*) FROM survey_responses`);

        // votes = unique users who responded (clean definition)
        const votes = await pool.query(`
            SELECT COUNT(DISTINCT respondent_code) FROM survey_responses
        `);

        const activeSurveys = await pool.query(`
            SELECT COUNT(*) FROM surveys WHERE status = 'active'
        `);

        // REAL-TIME UPDATE
        req.app.get('io').emit('analytics-update', {
            updated: true,
            time: new Date()
        });

        return res.json({
            data: {
                surveys: parseInt(surveys.rows[0].count || 0),
                users: parseInt(users.rows[0].count || 0),
                responses: parseInt(responses.rows[0].count || 0),
                votes: parseInt(votes.rows[0].count || 0),
                activeSurveys: parseInt(activeSurveys.rows[0].count || 0)
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Analytics error",
            error: error.message
        });
    }
};

// 📈 Admin: Live Participation Rate
exports.getParticipationRate = async (req, res) => {
    try {

        const totalUsers = await pool.query(`
            SELECT COUNT(*) FROM users WHERE role = 'VOTER'
        `);

        const totalVotes = await pool.query(`
            SELECT COUNT(DISTINCT user_id) FROM survey_responses
        `);

        const voters = parseInt(totalUsers.rows[0].count || 0);
        const voted = parseInt(totalVotes.rows[0].count || 0);

        const rate = voters === 0
            ? 0
            : ((voted / voters) * 100).toFixed(2);

        res.json({
            success: true,
            data: {
                total_voters: voters,
                total_voted: voted,
                participation_rate: rate + '%'
            }
        });

    } catch (err) {
        res.status(500).json({
            error: err.message
        });
    }
};