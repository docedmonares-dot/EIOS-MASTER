const pool = require('../config/database');
const { buildBiAnalytics } = require('../services/biAnalyticsService');

function analyticsLabel(value) {
    if (value === null || value === undefined || value === '') {
        return 'No answer';
    }

    if (Array.isArray(value)) {
        return value.map(analyticsLabel).join(', ');
    }

    if (typeof value === 'object') {
        const path = Array.isArray(value.path) ? value.path : [];
        const pathLabel = path
            .map((item) =>
                typeof item === 'object'
                    ? item?.unit_name ||
                        item?.official_name ||
                        item?.name ||
                        item?.label
                    : item
            )
            .filter(Boolean)
            .join(' / ');

        const selectedUnit = value.selected_unit;
        const selectedLabel =
            typeof selectedUnit === 'object'
                ? selectedUnit?.name || selectedUnit?.label
                : selectedUnit;

        return pathLabel ||
            selectedLabel ||
            value.selected_unit_name ||
            value.label ||
            JSON.stringify(value);
    }

    return String(value);
}

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
        const candidateMetricMap = {};
        const ballotFrequencyMap = {};

        rows.forEach(row => {
            const answers = row.answers_json || {};

            Object.keys(answers).forEach(question => {
                const rawValue = answers[question];
                const value = analyticsLabel(rawValue);

                if (
                    rawValue?.schema ===
                    'eios.candidate-evaluation.v1'
                ) {
                    Object.entries(
                        rawValue.candidates || {}
                    ).forEach(
                        ([candidateId, rating]) => {
                            const metric =
                                candidateMetricMap[candidateId] || {
                                    candidate_id: candidateId,
                                    candidate_label:
                                        rating.candidate_label || candidateId,
                                    response_count: 0,
                                    aware_count: 0,
                                    awareness_sum: 0,
                                    satisfaction_sum: 0,
                                    trust_sum: 0,
                                    aware_satisfaction_sum: 0,
                                    aware_trust_sum: 0,
                                    auto_neutral_count: 0,
                                };

                            metric.response_count += 1;
                            metric.awareness_sum += Number(
                                rating.awareness || 0
                            );
                            metric.satisfaction_sum += Number(
                                rating.satisfaction || 0
                            );
                            metric.trust_sum += Number(
                                rating.trust || 0
                            );

                            if (rating.awareness === 1) {
                                metric.aware_count += 1;
                                metric.aware_satisfaction_sum += Number(
                                    rating.satisfaction || 0
                                );
                                metric.aware_trust_sum += Number(
                                    rating.trust || 0
                                );
                            }

                            if (
                                rating.auto_assigned_from_not_aware
                            ) {
                                metric.auto_neutral_count += 1;
                            }

                            candidateMetricMap[candidateId] = metric;
                        }
                    );
                }

                if (
                    rawValue?.schema ===
                    'eios.ballot-selection.v1'
                ) {
                    const positionCode =
                        rawValue.position_code || 'UNSPECIFIED';
                    ballotFrequencyMap[positionCode] ||= {};

                    (rawValue.selected_candidates || []).forEach(
                        (candidate) => {
                            const candidateId =
                                candidate.candidate_id;
                            const current =
                                ballotFrequencyMap[positionCode][candidateId] || {
                                    candidate_id: candidateId,
                                    candidate_label:
                                        candidate.candidate_label || candidateId,
                                    count: 0,
                                };

                            current.count += 1;
                            ballotFrequencyMap[positionCode][candidateId] = current;
                        }
                    );
                }

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

        const candidateMetrics = Object.values(
            candidateMetricMap
        ).map((metric) => ({
            candidate_id: metric.candidate_id,
            candidate_label: metric.candidate_label,
            response_count: metric.response_count,
            aware_count: metric.aware_count,
            auto_neutral_count: metric.auto_neutral_count,
            awareness_mean:
                metric.response_count > 0
                    ? Number((metric.awareness_sum / metric.response_count).toFixed(3))
                    : null,
            satisfaction_mean:
                metric.response_count > 0
                    ? Number((metric.satisfaction_sum / metric.response_count).toFixed(3))
                    : null,
            trust_mean:
                metric.response_count > 0
                    ? Number((metric.trust_sum / metric.response_count).toFixed(3))
                    : null,
            aware_only_satisfaction_mean:
                metric.aware_count > 0
                    ? Number((metric.aware_satisfaction_sum / metric.aware_count).toFixed(3))
                    : null,
            aware_only_trust_mean:
                metric.aware_count > 0
                    ? Number((metric.aware_trust_sum / metric.aware_count).toFixed(3))
                    : null,
        }));

        const ballotFrequency = Object.fromEntries(
            Object.entries(ballotFrequencyMap).map(
                ([positionCode, candidates]) => [
                    positionCode,
                    Object.values(candidates).sort(
                        (left, right) =>
                            right.count - left.count
                    ),
                ]
            )
        );

        res.json({
            message: 'EIOS Analytics Engine v1',
            total_responses: totalResponses,
            frequency: frequencyMap,
            percentage: percentageMap,
            candidate_metrics: candidateMetrics,
            ballot_frequency: ballotFrequency
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err.message
        });
    }
};

exports.getBiAnalytics = async (req, res) => {
    try {
        if (!req.query.survey_id) {
            return res.status(400).json({
                success: false,
                message: 'Survey ID is required for BI analytics.'
            });
        }

        const analytics = await buildBiAnalytics({
            surveyId: req.query.survey_id,
            surveyVersionId: req.query.survey_version_id || null,
            questionKey: req.query.question || null,
            dimensionKey: req.query.dimension || null,
        });

        return res.json(analytics);
    } catch (error) {
        console.error('BI ANALYTICS ERROR:', error);
        return res.status(500).json({
            success: false,
            message: 'Unable to build BI analytics.',
            error: error.message
        });
    }
};
