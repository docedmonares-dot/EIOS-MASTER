const assert = require("assert");
const pool = require("./src/config/database");
const { buildBiAnalytics } = require("./src/services/biAnalyticsService");

async function run() {
    const surveyResult = await pool.query(
        `SELECT survey_id FROM survey_responses
         GROUP BY survey_id ORDER BY MAX(submitted_at) DESC LIMIT 1`
    );
    const surveyId = surveyResult.rows[0]?.survey_id;
    assert(surveyId, "A synchronized survey response is required for the BI contract test.");

    const analytics = await buildBiAnalytics({ surveyId });
    assert(analytics.total_responses > 0, "BI analytics must report its respondent base.");
    assert(analytics.summaries.length > 0, "BI analytics must dynamically decode active questions.");
    analytics.summaries.forEach((summary) => {
        assert(summary.valid_base + summary.missing_count === analytics.total_responses, "Each summary must disclose a complete response base.");
        summary.categories.forEach((category) => {
            assert(category.percentage >= 0 && category.percentage <= 100, "Percentages must remain in the valid range.");
        });
    });

    const dimension = analytics.dimensions[0];
    if (dimension) {
        const crossTabResult = await buildBiAnalytics({
            surveyId,
            questionKey: analytics.summaries[0].key,
            dimensionKey: dimension.key,
        });
        assert(crossTabResult.crosstab, "A selected demographic dimension must produce a cross-tabulation.");
    }

    console.log("Dynamic BI analytics contract passed.");
}

run()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
