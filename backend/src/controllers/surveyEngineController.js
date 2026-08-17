const pool = require("../config/database");

/* =========================================================
   HELPERS
========================================================= */

function cleanText(value) {
    if (value === null || value === undefined) {
        return null;
    }

    const cleanedValue = String(value).trim();

    return cleanedValue || null;
}

function createSurveyCode(coverageCode) {
    const datePart = new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    const randomPart = Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase();

    const prefix = String(coverageCode || "SURVEY")
        .replaceAll("_", "-")
        .slice(0, 20);

    return `${prefix}-${datePart}-${randomPart}`;
}

/* =========================================================
   SURVEY ENGINE SUMMARY
========================================================= */

exports.getSurveyEngineSummary = async (req, res) => {
    try {
        const surveysResult = await pool.query(`
            SELECT
                COUNT(*)::INTEGER AS total_surveys,

                COUNT(*) FILTER (
                    WHERE publication_status = 'Draft'
                )::INTEGER AS draft_surveys,

                COUNT(*) FILTER (
                    WHERE publication_status = 'Published'
                )::INTEGER AS published_surveys,

                COUNT(*) FILTER (
                    WHERE publication_status = 'Field Operations'
                )::INTEGER AS field_operation_surveys,

                COUNT(*) FILTER (
                    WHERE publication_status = 'Closed'
                )::INTEGER AS closed_surveys
            FROM surveys
        `);

        const coverageLevelsResult = await pool.query(`
            SELECT COUNT(*)::INTEGER AS active_coverage_levels
            FROM survey_coverage_levels
            WHERE is_active = TRUE
        `);

        return res.json({
            success: true,
            data: {
                total_surveys:
                    surveysResult.rows[0]?.total_surveys || 0,

                draft_surveys:
                    surveysResult.rows[0]?.draft_surveys || 0,

                published_surveys:
                    surveysResult.rows[0]?.published_surveys || 0,

                field_operation_surveys:
                    surveysResult.rows[0]
                        ?.field_operation_surveys || 0,

                closed_surveys:
                    surveysResult.rows[0]?.closed_surveys || 0,

                active_coverage_levels:
                    coverageLevelsResult.rows[0]
                        ?.active_coverage_levels || 0,

                executive_integration: "Connected"
            }
        });
    } catch (error) {
        console.error(
            "GET SURVEY ENGINE SUMMARY ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load Survey Engine summary.",
            error: error.message
        });
    }
};

/* =========================================================
   SURVEY COVERAGE LEVELS
========================================================= */

exports.getSurveyCoverageLevels = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                coverage_level_id,
                coverage_code,
                coverage_name,
                description,
                display_order,
                root_geo_type_codes,
                selectable_geo_type_codes,
                respondent_source_geo_type_codes,
                requires_stratification,
                allows_multiple_root_units,
                allows_operational_subareas,
                configuration_json,
                is_system_level,
                is_active
            FROM survey_coverage_levels
            WHERE is_active = TRUE
            ORDER BY display_order, coverage_name
        `);

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET SURVEY COVERAGE LEVELS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load survey coverage levels.",
            error: error.message
        });
    }
};

/* =========================================================
   SURVEY PROJECT REGISTRY
========================================================= */

exports.getSurveyProjects = async (req, res) => {
    try {
        const requestedLimit = Number(req.query.limit);

        const limit = Number.isInteger(requestedLimit)
            ? Math.min(Math.max(requestedLimit, 1), 100)
            : 50;

        const result = await pool.query(
            `
            SELECT
                survey.survey_id,
                survey.survey_code,
                survey.survey_name,
                survey.description,
                survey.survey_purpose,
                survey.publication_status,
                survey.status,
                survey.planned_start_date,
                survey.planned_end_date,
                survey.created_at,
                survey.updated_at,

                coverage.coverage_code,
                coverage.coverage_name,

                organization.organization_id,
                organization.organization_name,
                organization.organization_short_name
            FROM surveys AS survey
            LEFT JOIN survey_coverage_levels AS coverage
                ON coverage.coverage_level_id =
                   survey.coverage_level_id
            LEFT JOIN organizations AS organization
                ON organization.organization_id =
                   survey.organization_id
            ORDER BY survey.created_at DESC
            LIMIT $1
            `,
            [limit]
        );

        return res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error(
            "GET SURVEY PROJECTS ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Unable to load survey projects.",
            error: error.message
        });
    }
};

/* =========================================================
   CREATE SURVEY PROJECT
========================================================= */

exports.createSurveyProject = async (req, res) => {
    const client = await pool.connect();

    try {
        const surveyName = cleanText(req.body?.survey_name);
        const surveyPurpose = cleanText(
            req.body?.survey_purpose
        );
        const coverageLevelId = cleanText(
            req.body?.coverage_level_id
        );

        const description = cleanText(
            req.body?.description
        );

        const researchObjectives = cleanText(
            req.body?.research_objectives
        );

        const targetPopulation = cleanText(
            req.body?.target_population
        );

        const unitOfAnalysis = cleanText(
            req.body?.unit_of_analysis
        );

        const methodologySummary = cleanText(
            req.body?.methodology_summary
        );

        const plannedStartDate =
            req.body?.planned_start_date || null;

        const plannedEndDate =
            req.body?.planned_end_date || null;

        let organizationId = cleanText(
            req.body?.organization_id
        );

        if (!surveyName) {
            return res.status(400).json({
                success: false,
                message: "Survey project name is required."
            });
        }

        if (!coverageLevelId) {
            return res.status(400).json({
                success: false,
                message: "Survey coverage level is required."
            });
        }

        if (
            plannedStartDate &&
            plannedEndDate &&
            new Date(plannedEndDate) <
                new Date(plannedStartDate)
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Planned end date cannot be earlier than the planned start date."
            });
        }

        await client.query("BEGIN");

        const coverageResult = await client.query(
            `
            SELECT
                coverage_level_id,
                coverage_code,
                coverage_name,
                requires_stratification
            FROM survey_coverage_levels
            WHERE coverage_level_id = $1
              AND is_active = TRUE
            LIMIT 1
            `,
            [coverageLevelId]
        );

        if (coverageResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message:
                    "The selected survey coverage level was not found."
            });
        }

        const coverageLevel = coverageResult.rows[0];

        if (!organizationId) {
            const organizationResult = await client.query(`
                SELECT organization_id
                FROM organizations
                WHERE is_primary_organization = TRUE
                  AND status = 'Active'
                ORDER BY created_at
                LIMIT 1
            `);

            organizationId =
                organizationResult.rows[0]
                    ?.organization_id || null;
        }

        if (organizationId) {
            const organizationValidation =
                await client.query(
                    `
                    SELECT organization_id
                    FROM organizations
                    WHERE organization_id = $1
                      AND status = 'Active'
                    LIMIT 1
                    `,
                    [organizationId]
                );

            if (
                organizationValidation.rows.length === 0
            ) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        "The selected organization was not found."
                });
            }
        }

        const requestedBy =
            req.user?.user_id ??
            req.user?.id ??
            null;

        let surveyCode = cleanText(
            req.body?.survey_code
        );

        if (!surveyCode) {
            surveyCode = createSurveyCode(
                coverageLevel.coverage_code
            );
        } else {
            surveyCode = surveyCode.toUpperCase();
        }

        const duplicateSurveyCode =
            await client.query(
                `
                SELECT survey_id
                FROM surveys
                WHERE UPPER(survey_code) = UPPER($1)
                LIMIT 1
                `,
                [surveyCode]
            );

        if (duplicateSurveyCode.rows.length > 0) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "The survey code is already being used."
            });
        }

        const settingsResult = await client.query(`
            SELECT
                setting_key,
                setting_value
            FROM enterprise_settings
            WHERE setting_key IN (
                'field.supervisor_max_enumerators',
                'field.enumerator_minimum_respondents',
                'gps.tracking_enabled',
                'sync.automatic_sync_enabled'
            )
              AND is_active = TRUE
        `);

        const settings = Object.fromEntries(
            settingsResult.rows.map((setting) => [
                setting.setting_key,
                setting.setting_value
            ])
        );

        const maximumEnumeratorsPerSupervisor =
            Number(
                settings[
                    "field.supervisor_max_enumerators"
                ] || 10
            );

        const minimumRespondentsPerEnumerator =
            Number(
                settings[
                    "field.enumerator_minimum_respondents"
                ] || 30
            );

        const gpsRequired =
            String(
                settings["gps.tracking_enabled"] ??
                    "true"
            ).toLowerCase() === "true";

        const automaticSyncEnabled =
            String(
                settings[
                    "sync.automatic_sync_enabled"
                ] ?? "true"
            ).toLowerCase() === "true";

        const surveyResult = await client.query(
            `
            INSERT INTO surveys (
                survey_code,
                survey_name,
                organization_id,
                coverage_level_id,
                geographic_scope,
                description,
                survey_purpose,
                research_objectives,
                target_population,
                unit_of_analysis,
                methodology_summary,
                planned_start_date,
                planned_end_date,
                project_owner_user_id,
                status,
                publication_status,
                current_version_number,
                created_by,
                updated_by,
                configuration_json
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7,
                $8,
                $9,
                $10,
                $11,
                $12,
                $13,
                $14,
                'Draft',
                'Draft',
                0,
                $14,
                $14,
                $15::jsonb
            )
            RETURNING
                survey_id,
                survey_code,
                survey_name,
                organization_id,
                coverage_level_id,
                survey_purpose,
                description,
                planned_start_date,
                planned_end_date,
                status,
                publication_status,
                created_at
            `,
            [
                surveyCode,
                surveyName,
                organizationId,
                coverageLevel.coverage_level_id,
                coverageLevel.coverage_name,
                description,
                surveyPurpose,
                researchObjectives,
                targetPopulation,
                unitOfAnalysis,
                methodologySummary,
                plannedStartDate,
                plannedEndDate,
                requestedBy,
                JSON.stringify({
                    creation_source:
                        "Dynamic Survey Engine",
                    no_code_project: true
                })
            ]
        );

        const createdSurvey = surveyResult.rows[0];

        await client.query(
            `
            INSERT INTO survey_sampling_configurations (
                survey_id,
                sampling_method,
                stratification_required,
                methodology_json,
                status,
                created_by,
                updated_by
            )
            VALUES (
                $1,
                'To Be Configured',
                $2,
                $3::jsonb,
                'Draft',
                $4,
                $4
            )
            `,
            [
                createdSurvey.survey_id,
                coverageLevel.requires_stratification,
                JSON.stringify({
                    coverage_code:
                        coverageLevel.coverage_code,
                    configuration_pending: true
                }),
                requestedBy
            ]
        );

        await client.query(
            `
            INSERT INTO survey_operational_configurations (
                survey_id,
                maximum_enumerators_per_supervisor,
                minimum_respondents_per_enumerator,
                gps_required,
                attendance_required,
                offline_collection_enabled,
                automatic_sync_enabled,
                supervisor_validation_required,
                configuration_json,
                status,
                created_by,
                updated_by
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                TRUE,
                TRUE,
                $5,
                TRUE,
                $6::jsonb,
                'Draft',
                $7,
                $7
            )
            `,
            [
                createdSurvey.survey_id,
                maximumEnumeratorsPerSupervisor,
                minimumRespondentsPerEnumerator,
                gpsRequired,
                automaticSyncEnabled,
                JSON.stringify({
                    defaults_source:
                        "enterprise_settings",
                    administrator_editable: true
                }),
                requestedBy
            ]
        );

        await client.query(
            `
            INSERT INTO survey_publication_history (
                survey_id,
                previous_status,
                new_status,
                publication_action,
                action_reason,
                acted_by,
                metadata_json
            )
            VALUES (
                $1,
                NULL,
                'Draft',
                'Survey Project Created',
                'Initial no-code survey project creation.',
                $2,
                $3::jsonb
            )
            `,
            [
                createdSurvey.survey_id,
                requestedBy,
                JSON.stringify({
                    coverage_code:
                        coverageLevel.coverage_code
                })
            ]
        );

        await client.query("COMMIT");

        const io = req.app.get("io");

        if (io) {
            io.emit(
                "survey-project-created",
                createdSurvey
            );

            io.emit("survey-engine-summary-refresh");
            io.emit("dashboard-summary-refresh");
        }

        return res.status(201).json({
            success: true,
            message:
                "Survey project created successfully.",
            data: {
                ...createdSurvey,
                coverage_code:
                    coverageLevel.coverage_code,
                coverage_name:
                    coverageLevel.coverage_name,
                operational_defaults: {
                    maximum_enumerators_per_supervisor:
                        maximumEnumeratorsPerSupervisor,

                    minimum_respondents_per_enumerator:
                        minimumRespondentsPerEnumerator,

                    gps_required: gpsRequired,

                    automatic_sync_enabled:
                        automaticSyncEnabled
                }
            }
        });
    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "CREATE SURVEY PROJECT ERROR:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Unable to create the survey project.",
            error: error.message
        });
    } finally {
        client.release();
    }
};