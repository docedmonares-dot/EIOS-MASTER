const pool = require("../config/database");

function clean(value) {
    return value === null || value === undefined || value === "" ? null : value;
}

function percent(count, base) {
    return base > 0 ? Number(((count / base) * 100).toFixed(2)) : 0;
}

function choiceLabels(question) {
    const labels = new Map();
    const choices = question?.choice_list?.choices || question?.choice_list?.options || [];
    choices.forEach((choice) => {
        const label = choice.option_label ?? choice.choice_label ?? choice.label;
        [choice.option_code, choice.choice_code, choice.option_value, choice.value]
            .filter((value) => value !== undefined && value !== null)
            .forEach((value) => labels.set(String(value), label || String(value)));
    });
    return labels;
}

function addDefinition(definitions, key, definition) {
    if (!definitions.has(key)) definitions.set(key, { key, ...definition });
}

function decodeResponse(response, definitions) {
    const values = {};
    const questions = Array.isArray(response.question_snapshot) ? response.question_snapshot : [];
    const questionMap = new Map(questions.map((question) => [question.question_id || question.questionnaire_item_id, question]));

    questions.forEach((question) => {
        const variable = question.variable_name || question.question_code || question.question_id;
        const questionType = question.question_type?.type_code || question.runtime?.type_code || "UNKNOWN";
        const baseDefinition = {
            label: question.question_text || variable,
            section_code: question.section_code || "UNASSIGNED",
            section_title: question.section_title || "Unassigned Questions",
            question_type: questionType,
            dimension_eligible: question.section_code === "RESPONDENT_PROFILE" || questionType === "GEOGRAPHIC_SELECTOR",
            multiple: ["MULTIPLE_CHOICE", "BALLOT_SELECTOR"].includes(questionType),
        };

        if (questionType === "CANDIDATE_EVALUATION") {
            const choices = question?.choice_list?.choices || question?.choice_list?.options || [];
            choices
                .filter((choice) => String(choice.option_code || choice.choice_code || "").toUpperCase() !== "UNDECIDED")
                .forEach((choice) => {
                    const candidateId = choice.option_code || choice.choice_code || choice.option_value;
                    const candidateLabel = choice.option_label || choice.choice_label || candidateId;
                    ["awareness", "satisfaction", "trust"].forEach((measure) => {
                        addDefinition(definitions, `${variable}__${candidateId}__${measure}`, {
                            ...baseDefinition,
                            label: `${candidateLabel} — ${measure[0].toUpperCase()}${measure.slice(1)}`,
                            question_type: `CANDIDATE_${measure.toUpperCase()}`,
                            dimension_eligible: false,
                        });
                    });
                });
            return;
        }

        addDefinition(definitions, variable, baseDefinition);
    });

    Object.entries(response.answers_json || {}).forEach(([questionId, answer]) => {
        const question = questionMap.get(questionId);
        if (!question) return;
        const variable = question.variable_name || question.question_code || questionId;
        const baseDefinition = {
            label: question.question_text || variable,
            section_code: question.section_code || "UNASSIGNED",
            section_title: question.section_title || "Unassigned Questions",
            question_type: question.question_type?.type_code || question.runtime?.type_code || "UNKNOWN",
            dimension_eligible: question.section_code === "RESPONDENT_PROFILE",
            multiple: false,
        };

        if (answer?.schema === "eios.geographic-selection.v1") {
            values[variable] = (answer.path || []).map((item) => item.unit_name).filter(Boolean).join(" / ") || answer.selected_unit_name;
            addDefinition(definitions, variable, { ...baseDefinition, dimension_eligible: true });
            (answer.path || []).forEach((unit) => {
                const dimensionKey = `geo_${String(unit.type_code || unit.type_name || "unit").toLowerCase()}`;
                values[dimensionKey] = unit.unit_name || unit.official_name;
                addDefinition(definitions, dimensionKey, {
                    label: `Geography: ${unit.type_name || unit.type_code}`,
                    section_code: "GEOGRAPHY",
                    section_title: "Geographic Demographics",
                    question_type: "GEOGRAPHIC_DIMENSION",
                    dimension_eligible: true,
                    multiple: false,
                });
            });
            return;
        }

        if (answer?.schema === "eios.candidate-evaluation.v1") {
            Object.entries(answer.candidates || {}).forEach(([candidateId, rating]) => {
                const candidateLabel = rating.candidate_label || candidateId;
                [
                    ["awareness", { 1: "Aware", 2: "Not aware" }],
                    ["satisfaction", { 1: "Satisfied", 2: "Neutral", 3: "Not satisfied" }],
                    ["trust", { 1: "Trust", 2: "Neutral", 3: "Distrust" }],
                ].forEach(([measure, labels]) => {
                    const key = `${variable}__${candidateId}__${measure}`;
                    values[key] = labels[rating[measure]] || rating[measure];
                    addDefinition(definitions, key, {
                        ...baseDefinition,
                        label: `${candidateLabel} — ${measure[0].toUpperCase()}${measure.slice(1)}`,
                        question_type: `CANDIDATE_${measure.toUpperCase()}`,
                    });
                });
            });
            return;
        }

        if (answer?.schema === "eios.ballot-selection.v1") {
            values[variable] = (answer.selected_candidates || []).map((candidate) => candidate.candidate_label || candidate.candidate_id);
            addDefinition(definitions, variable, { ...baseDefinition, multiple: true });
            return;
        }

        const labels = choiceLabels(question);
        const labelValue = (value) => labels.get(String(value)) || value;
        values[variable] = Array.isArray(answer)
            ? answer.map(labelValue)
            : typeof answer === "object" && answer !== null
                ? JSON.stringify(answer)
                : labelValue(answer);
        addDefinition(definitions, variable, {
            ...baseDefinition,
            multiple: Array.isArray(answer),
        });
    });

    return values;
}

function summarize(key, definition, decodedRows) {
    const counts = new Map();
    let validBase = 0;
    let missing = 0;

    decodedRows.forEach((row) => {
        const raw = clean(row[key]);
        if (raw === null || (Array.isArray(raw) && raw.length === 0)) {
            missing += 1;
            return;
        }
        validBase += 1;
        const categories = Array.isArray(raw) ? [...new Set(raw.map(String))] : [String(raw)];
        categories.forEach((category) => counts.set(category, (counts.get(category) || 0) + 1));
    });

    return {
        ...definition,
        valid_base: validBase,
        missing_count: missing,
        total_responses: decodedRows.length,
        percentage_basis: definition.multiple ? "Respondents selecting option" : "Valid responses",
        categories: [...counts.entries()]
            .map(([label, count]) => ({ label, count, percentage: percent(count, validBase) }))
            .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    };
}

function buildCrossTab(questionKey, dimensionKey, definitions, decodedRows) {
    if (!questionKey || !dimensionKey || !definitions.has(questionKey) || !definitions.has(dimensionKey)) return null;
    const cells = new Map();
    const dimensionTotals = new Map();
    let validBase = 0;

    decodedRows.forEach((row) => {
        const questionValue = clean(row[questionKey]);
        const dimensionValue = clean(row[dimensionKey]);
        if (questionValue === null || dimensionValue === null) return;
        validBase += 1;
        const dimension = String(dimensionValue);
        dimensionTotals.set(dimension, (dimensionTotals.get(dimension) || 0) + 1);
        const answers = Array.isArray(questionValue) ? [...new Set(questionValue.map(String))] : [String(questionValue)];
        answers.forEach((answer) => {
            const key = `${dimension}\u0000${answer}`;
            cells.set(key, (cells.get(key) || 0) + 1);
        });
    });

    return {
        question: definitions.get(questionKey),
        dimension: definitions.get(dimensionKey),
        valid_base: validBase,
        groups: [...dimensionTotals.entries()].map(([dimension, base]) => ({
            dimension,
            base,
            cells: [...cells.entries()]
                .filter(([key]) => key.startsWith(`${dimension}\u0000`))
                .map(([key, count]) => ({ answer: key.split("\u0000")[1], count, column_percentage: percent(count, base) }))
                .sort((left, right) => right.count - left.count),
        })),
    };
}

async function buildBiAnalytics({ surveyId, surveyVersionId = null, questionKey = null, dimensionKey = null }) {
    const result = await pool.query(
        `SELECT sr.answers_json, sr.survey_id, sr.survey_version_id,
                s.survey_code, s.survey_name,
                sv.version_number, sv.question_snapshot
         FROM survey_responses sr
         JOIN surveys s ON s.survey_id = sr.survey_id
         LEFT JOIN survey_versions sv ON sv.survey_version_id = sr.survey_version_id
         WHERE sr.survey_id = $1
           AND ($2::uuid IS NULL OR sr.survey_version_id = $2)
         ORDER BY sr.submitted_at`,
        [surveyId, surveyVersionId]
    );

    const definitions = new Map();
    const decodedRows = result.rows.map((response) => decodeResponse(response, definitions));
    const summaries = [...definitions.entries()]
        .filter(([, definition]) => definition.question_type !== "GEOGRAPHIC_DIMENSION")
        .map(([key, definition]) => summarize(key, definition, decodedRows));
    const dimensions = [...definitions.values()].filter((definition) => definition.dimension_eligible);

    return {
        survey: result.rows[0] ? {
            survey_id: result.rows[0].survey_id,
            survey_code: result.rows[0].survey_code,
            survey_name: result.rows[0].survey_name,
        } : null,
        total_responses: decodedRows.length,
        summaries,
        dimensions,
        crosstab: buildCrossTab(questionKey, dimensionKey, definitions, decodedRows),
    };
}

module.exports = { buildBiAnalytics };
