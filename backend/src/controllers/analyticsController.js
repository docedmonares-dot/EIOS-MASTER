const pool = require('../config/database');

exports.getFrequencies = async (req, res) => {
    try {
        const result = await pool.query(
    `
    SELECT answers_json
    FROM survey_responses
    WHERE ($1::uuid IS NULL OR survey_id = $1)
      AND ($2::uuid IS NULL OR survey_version_id = $2)
      AND ($3::uuid IS NULL OR deployment_id = $3)
    `,
    [
        req.query.survey_id || null,
        req.query.survey_version_id || null,
        req.query.deployment_id || null
    ]
);
        const rows = result.rows;

        // 🔥 Frequency container
        const frequencyMap = {};

        rows.forEach(row => {
            const answers = row.answers_json || {};

            Object.keys(answers).forEach(question => {
                const value = answers[question];

                if (!frequencyMap[question]) {
                    frequencyMap[question] = {};
                }

                if (!frequencyMap[question][value]) {
                    frequencyMap[question][value] = 0;
                }

                frequencyMap[question][value] += 1;
            });
        });

        // 🔥 Convert to percentage
        const totalResponses = rows.length;

        const percentageMap = {};

        Object.keys(frequencyMap).forEach(question => {
            percentageMap[question] = {};

            Object.keys(frequencyMap[question]).forEach(value => {
                const count = frequencyMap[question][value];

                percentageMap[question][value] =
                    ((count / totalResponses) * 100).toFixed(2) + '%';
            });
        });

        res.json({
            message: 'EIOS Analytics Engine v1',
            total_responses: totalResponses,
            frequency: frequencyMap,
            percentage: percentageMap
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};