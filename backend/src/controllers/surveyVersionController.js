const pool = require("../config/database");
const {
    compileForPublication,
} = require("../services/metadataCompiler");

exports.publishSurveyVersion = async (req, res) => {
    let client = null;

    try {
        const compilation =
            await compileForPublication(
                req.params.id
            );

        const compiledPackage =
            compilation.package;

        client = await pool.connect();
        await client.query("BEGIN");

        const surveyId = req.params.id;

        const surveyResult = await client.query(
            `
            SELECT *
            FROM surveys
            WHERE survey_id = $1
            `,
            [surveyId]
        );

        if (surveyResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Survey not found."
            });
        }

        const sectionsResult = await client.query(
            `
            SELECT *
            FROM survey_sections
            WHERE survey_id = $1
            ORDER BY page_number, sort_order
            `,
            [surveyId]
        );

        const questionSnapshot =
            compiledPackage.sections.flatMap(
                (section) =>
                    section.questions.map(
                        (question) => ({
                            ...question,
                            question_id:
                                question.questionnaire_item_id,
                            section_code:
                                section.section_code,
                            section_title:
                                section.section_title,
                        })
                    )
            );

        /*
         * Snapshot only Active Question Logic
         * belonging to questions actually included
         * in this survey.
         */
        const logicResult = await client.query(
            `
            SELECT
                ql.logic_id,
                ql.question_id,
                ql.logic_name,
                ql.condition_json,
                ql.action_json,
                ql.affected_questions_json,
                ql.logic_status,
                ql.created_by,
                ql.created_at,
                ql.updated_by,
                ql.updated_at,

                qb.question_code
                    AS source_question_code,

                qb.question_text
                    AS source_question_text

            FROM question_logic ql

            INNER JOIN survey_questions sq
                ON sq.question_id =
                    ql.question_id

            INNER JOIN question_bank qb
                ON qb.question_id =
                    ql.question_id

            WHERE
                sq.survey_id = $1
                AND sq.is_active = true
                AND ql.logic_status = 'Active'

            ORDER BY
                sq.page_number,
                sq.sort_order,
                ql.created_at,
                ql.logic_id
            `,
            [surveyId]
        );

        const versionResult = await client.query(
            `
            SELECT
                COALESCE(
                    MAX(version_number),
                    0
                ) + 1 AS next_version
            FROM survey_versions
            WHERE survey_id = $1
            `,
            [surveyId]
        );

        const nextVersion =
            Number(
                versionResult.rows[0]
                    .next_version
            );

        await client.query(
            `
            UPDATE survey_versions
            SET is_active_version = false
            WHERE survey_id = $1
            `,
            [surveyId]
        );

        const insertResult = await client.query(
            `
            INSERT INTO survey_versions
            (
                survey_id,
                version_number,
                version_label,
                survey_snapshot,
                question_snapshot,
                logic_snapshot,
                publish_notes,
                is_active_version
            )
            VALUES
            (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                true
            )
            RETURNING *
            `,
            [
                surveyId,

                nextVersion,

                `Version ${nextVersion}`,

                JSON.stringify(
                    {
                        ...surveyResult.rows[0],
                        compiled_manifest:
                            compiledPackage.manifest,
                        compiled_form:
                            compiledPackage.form,
                    }
                ),

                JSON.stringify(
                    questionSnapshot
                ),

                JSON.stringify(
                    logicResult.rows
                ),

                "Published through EIOS API"
            ]
        );

        await client.query("COMMIT");

        return res.json({
            success: true,

            message:
                "Survey version published successfully.",

            version:
                insertResult.rows[0],

            sections_count:
                sectionsResult.rows.length,

            questions_count:
                questionSnapshot.length,

            logic_count:
                logicResult.rows.length
        });
    } catch (err) {
        try {
            await client?.query(
                "ROLLBACK"
            );
        } catch (rollbackError) {
            console.error(
                rollbackError
            );
        }

        console.error(err);

        return res.status(
            err.statusCode || 500
        ).json({
            success: false,
            error: err.message,
            code: err.code || null,
            validation:
                err.validationReport || null
        });
    } finally {
        client?.release();
    }
};

exports.getSurveyVersions = async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT *
            FROM survey_versions
            WHERE survey_id = $1
            ORDER BY version_number DESC
            `,
            [req.params.id]
        );

        return res.json(
            result.rows
        );
    } catch (err) {
        console.error(err);

        return res.status(500).json({
            success: false,
            error: err.message
        });
    }
};
