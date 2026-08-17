const pool = require('../config/database');

exports.compareByWave = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                sr.answers_json,
                COALESCE(sw.wave_name, 'Unknown Wave') AS wave_name
            FROM survey_responses sr
            LEFT JOIN survey_versions sv
                ON sr.survey_version_id = sv.survey_version_id
            LEFT JOIN survey_waves sw
                ON sw.wave_id = sw.wave_id
        `);

        const rows = result.rows;

        const waveMap = {};

        rows.forEach(row => {
            const wave = row.wave_name || 'Unknown Wave';
            const answers = row.answers_json || {};

            if (!waveMap[wave]) {
                waveMap[wave] = {
                    total: 0,
                    questions: {}
                };
            }

            waveMap[wave].total++;
            waveMap[wave].percentages = waveMap[wave].percentages || {};
            waveMap[wave].percentages = waveMap[wave].percentages || {};

            Object.keys(answers).forEach(q => {
                const value = answers[q];

                if (!waveMap[wave].questions[q]) {
                    waveMap[wave].questions[q] = {};
                }

                if (!waveMap[wave].questions[q][value]) {
                    waveMap[wave].questions[q][value] = 0;
                }

                waveMap[wave].questions[q][value] += 1;
                waveMap[wave].percentages[q] = waveMap[wave].percentages[q] || {};

waveMap[wave].percentages[q][value] =
    ((waveMap[wave].questions[q][value] / waveMap[wave].total) * 100).toFixed(2) + '%';
waveMap[wave].insights = waveMap[wave].insights || {};
waveMap[wave].insights[q] = waveMap[wave].insights[q] || {};

const values = waveMap[wave].questions[q];
const sorted = Object.entries(values).sort((a, b) => b[1] - a[1]);

waveMap[wave].insights[q].top_choice = sorted[0][0];
waveMap[wave].insights[q].strength =
    ((sorted[0][1] / waveMap[wave].total) * 100).toFixed(2) + '%';    
                waveMap[wave].percentages[q] = waveMap[wave].percentages[q] || {};

                waveMap[wave].percentages[q][value] =
    ((waveMap[wave].questions[q][value] / waveMap[wave].total) * 100).toFixed(2) + '%';
            });
        });

        return res.json({
    message: 'EIOS Advanced Intelligence Engine v2',
    insight_type: 'decision_intelligence',
    summary: {
        total_waves: Object.keys(waveMap).length,
        total_responses: rows.length
    },
    data: waveMap
});

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            error: err.message
        });
    }
};