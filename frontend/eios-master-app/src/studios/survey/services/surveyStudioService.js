import {
  getSurveyEngineSummary,
  getSurveyProjects,
} from "../../../services/surveyEngineService";

function normalizeSurveyProject(project) {
  return {
    id: project.survey_id,
    survey_id: project.survey_id,

    code:
      project.survey_code ||
      "No code",

    name:
      project.survey_name ||
      "Untitled Survey",

    description:
      project.description || "",

    purpose:
      project.survey_purpose || "",

    coverage:
      project.coverage_name ||
      "Not configured",

    coverage_code:
      project.coverage_code || "",

    organization:
      project.organization_short_name ||
      project.organization_name ||
      "Not assigned",

    organization_id:
      project.organization_id || null,

    status:
      project.publication_status ||
      project.status ||
      "Draft",

    version:
      project.version_number
        ? String(project.version_number)
        : "1.0",

    questions:
      Number(
        project.question_count || 0
      ),

    planned_start_date:
      project.planned_start_date || null,

    planned_end_date:
      project.planned_end_date || null,

    created_at:
      project.created_at || null,

    updated_at:
      project.updated_at || null,

    updated:
      project.updated_at
        ? new Date(
            project.updated_at
          ).toLocaleString()
        : "Not available",
  };
}

export async function getSurveyStudioProjects(
  limit = 100
) {
  const projects =
    await getSurveyProjects(limit);

  return (projects || []).map(
    normalizeSurveyProject
  );
}

export async function getSurveyStudioSummary() {
  const summary =
    await getSurveyEngineSummary();

  return {
    total_surveys:
      Number(summary?.total_surveys || 0),

    draft_surveys:
      Number(summary?.draft_surveys || 0),

    published_surveys:
      Number(
        summary?.published_surveys || 0
      ),

    field_operation_surveys:
      Number(
        summary?.field_operation_surveys ||
          0
      ),

    closed_surveys:
      Number(summary?.closed_surveys || 0),

    active_coverage_levels:
      Number(
        summary?.active_coverage_levels ||
          0
      ),

    executive_integration:
      summary?.executive_integration ||
      "Connected",
  };
}

export async function getSurveyStudioData(
  limit = 100
) {
  const [
    projects,
    summary,
  ] = await Promise.all([
    getSurveyStudioProjects(limit),
    getSurveyStudioSummary(),
  ]);

  return {
    projects,
    summary,
  };
}