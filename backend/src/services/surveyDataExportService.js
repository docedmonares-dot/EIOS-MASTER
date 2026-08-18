const pool = require("../config/database");

function safeName(value, fallback = "variable") {
    const normalized = String(value || fallback)
        .trim()
        .replace(/[^A-Za-z0-9_]/g, "_")
        .replace(/^[^A-Za-z]/, "v_$&")
        .replace(/_+/g, "_");
    return normalized.slice(0, 64) || fallback;
}

function scalar(value) {
    if (value === null || value === undefined) return null;
    if (["string", "number", "boolean"].includes(typeof value)) return value;
    if (Array.isArray(value)) return value.join(" | ");
    return JSON.stringify(value);
}

function flattenAnswer(variable, answer, row, columns) {
    const add = (name, value, label, valueLabels = null) => {
        const key = safeName(name);
        row[key] = scalar(value);
        if (!columns.has(key)) columns.set(key, { name: key, label, valueLabels });
    };

    if (answer?.schema === "eios.geographic-selection.v1") {
        add(`${variable}_code`, answer.selected_official_code, `${variable}: official geographic code`);
        add(`${variable}_name`, answer.selected_unit_name, `${variable}: selected geographic unit`);
        add(`${variable}_type`, answer.selected_type_code, `${variable}: geographic unit type`);
        add(`${variable}_path`, (answer.path || []).map((item) => item.unit_name).join(" / "), `${variable}: full geographic path`);
        return;
    }

    if (answer?.schema === "eios.candidate-evaluation.v1") {
        Object.entries(answer.candidates || {}).forEach(([candidateId, rating]) => {
            const candidate = safeName(candidateId);
            const label = rating.candidate_label || candidateId;
            add(`${variable}_${candidate}_aw`, rating.awareness, `${label}: Awareness`, { 1: "Aware", 2: "Not aware" });
            add(`${variable}_${candidate}_sat`, rating.satisfaction, `${label}: Satisfaction`, { 1: "Satisfied", 2: "Neutral", 3: "Not satisfied" });
            add(`${variable}_${candidate}_trust`, rating.trust, `${label}: Trust`, { 1: "Trust", 2: "Neutral", 3: "Distrust" });
        });
        return;
    }

    if (answer?.schema === "eios.ballot-selection.v1") {
        add(variable, (answer.selected_candidate_ids || []).join(" | "), `${variable}: selected candidate codes`);
        add(`${variable}_labels`, (answer.selected_candidates || []).map((item) => item.candidate_label).join(" | "), `${variable}: selected candidate labels`);
        return;
    }

    add(variable, answer, variable);
}

function choiceValueLabels(question) {
    const choices = question?.choice_list?.choices || question?.choice_list?.options || [];
    const labels = {};
    choices.forEach((choice) => {
        const value = choice.option_value ?? choice.text_value ?? choice.option_code ?? choice.choice_code;
        const label = choice.option_label ?? choice.choice_label ?? choice.label;
        if (value !== undefined && label) labels[value] = label;
    });
    return Object.keys(labels).length ? labels : null;
}

async function buildSurveyExport(surveyId) {
    const result = await pool.query(
        `SELECT sr.*, s.survey_code, s.survey_name,
                sv.version_number, sv.version_label, sv.question_snapshot
         FROM survey_responses sr
         JOIN surveys s ON s.survey_id = sr.survey_id
         LEFT JOIN survey_versions sv ON sv.survey_version_id = sr.survey_version_id
         WHERE sr.survey_id = $1
         ORDER BY sr.submitted_at, sr.response_id`,
        [surveyId]
    );

    if (result.rows.length === 0) {
        const survey = await pool.query(
            "SELECT survey_code, survey_name FROM surveys WHERE survey_id = $1",
            [surveyId]
        );
        if (!survey.rows[0]) throw Object.assign(new Error("Survey was not found."), { status: 404 });
    }

    const columns = new Map();
    const coreColumns = [
        ["response_id", "Server response ID"],
        ["respondent_code", "Respondent code"],
        ["survey_code", "Survey code"],
        ["survey_name", "Survey name"],
        ["version_number", "Survey version"],
        ["version_label", "Version label"],
        ["deployment_id", "Deployment ID"],
        ["enumerator_id", "Enumerator ID"],
        ["submitted_at", "Submission timestamp"],
    ];
    coreColumns.forEach(([name, label]) => columns.set(name, { name, label, valueLabels: null }));

    const rows = result.rows.map((response) => {
        const row = Object.fromEntries(coreColumns.map(([name]) => [name, response[name] ?? null]));
        const questions = Array.isArray(response.question_snapshot) ? response.question_snapshot : [];
        const questionMap = new Map(questions.map((question) => [question.question_id || question.questionnaire_item_id, question]));

        Object.entries(response.answers_json || {}).forEach(([questionId, answer]) => {
            const question = questionMap.get(questionId) || {};
            const variable = safeName(question.variable_name || question.question_code || questionId);
            const before = new Set(columns.keys());
            flattenAnswer(variable, answer, row, columns);
            const labels = choiceValueLabels(question);
            if (labels) {
                [...columns.keys()].filter((key) => !before.has(key) && key === variable).forEach((key) => {
                    columns.set(key, { ...columns.get(key), label: question.question_text || variable, valueLabels: labels });
                });
            }
        });
        return row;
    });

    return {
        survey: result.rows[0] ? { survey_code: result.rows[0].survey_code, survey_name: result.rows[0].survey_name } : null,
        columns: [...columns.values()],
        rows,
    };
}

module.exports = { buildSurveyExport };
