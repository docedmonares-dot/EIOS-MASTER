import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import MainLayout from "../../../layouts/MainLayout";

import {
  createSurveyProject,
  getSurveyCoverageLevels,
  getSurveyEngineSummary,
  getSurveyProjects,
} from "../../../services/surveyEngineService";

const initialFormData = {
  survey_name: "",
  survey_code: "",
  coverage_level_id: "",
  survey_purpose: "",
  description: "",
  research_objectives: "",
  target_population: "",
  unit_of_analysis: "",
  methodology_summary: "",
  planned_start_date: "",
  planned_end_date: "",
};

export default function SurveyEnginePage() {
  const navigate = useNavigate(); 
  const [summary, setSummary] = useState({
    total_surveys: 0,
    draft_surveys: 0,
    published_surveys: 0,
    field_operation_surveys: 0,
    closed_surveys: 0,
    active_coverage_levels: 0,
    executive_integration: "Checking",
  });

  const [coverageLevels, setCoverageLevels] = useState([]);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [savingProject, setSavingProject] = useState(false);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  const [formData, setFormData] =
    useState(initialFormData);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const selectedCoverageLevel = useMemo(
    () =>
      coverageLevels.find(
        (coverageLevel) =>
          coverageLevel.coverage_level_id ===
          formData.coverage_level_id
      ) || null,
    [coverageLevels, formData.coverage_level_id]
  );

  const loadSurveyEngine = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const [
        summaryData,
        coverageLevelData,
        projectData,
      ] = await Promise.all([
        getSurveyEngineSummary(),
        getSurveyCoverageLevels(),
        getSurveyProjects(50),
      ]);

      setSummary({
        total_surveys:
          summaryData?.total_surveys ?? 0,

        draft_surveys:
          summaryData?.draft_surveys ?? 0,

        published_surveys:
          summaryData?.published_surveys ?? 0,

        field_operation_surveys:
          summaryData?.field_operation_surveys ?? 0,

        closed_surveys:
          summaryData?.closed_surveys ?? 0,

        active_coverage_levels:
          summaryData?.active_coverage_levels ?? 0,

        executive_integration:
          summaryData?.executive_integration ||
          "Connected",
      });

      setCoverageLevels(coverageLevelData || []);
      setProjects(projectData || []);
    } catch (error) {
      console.error(
        "Survey Engine loading failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to load the Survey Engine."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurveyEngine();
  }, [loadSurveyEngine]);

  function openCreateModal() {
    setFormData(initialFormData);
    setErrorMessage("");
    setSuccessMessage("");
    setIsCreateModalOpen(true);
  }

  function closeCreateModal() {
    if (savingProject) {
      return;
    }

    setIsCreateModalOpen(false);
    setFormData(initialFormData);
  }

  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }));
  }

  async function handleCreateProject(event) {
    event.preventDefault();

    try {
      setSavingProject(true);
      setErrorMessage("");
      setSuccessMessage("");

      if (!formData.survey_name.trim()) {
        throw new Error(
          "Survey project name is required."
        );
      }

      if (!formData.coverage_level_id) {
        throw new Error(
          "Survey coverage level is required."
        );
      }

      if (
        formData.planned_start_date &&
        formData.planned_end_date &&
        formData.planned_end_date <
          formData.planned_start_date
      ) {
        throw new Error(
          "Planned end date cannot be earlier than the planned start date."
        );
      }

      const createdProject =
        await createSurveyProject({
          survey_name: formData.survey_name.trim(),

          survey_code:
            formData.survey_code.trim() || null,

          coverage_level_id:
            formData.coverage_level_id,

          survey_purpose:
            formData.survey_purpose.trim() || null,

          description:
            formData.description.trim() || null,

          research_objectives:
            formData.research_objectives.trim() ||
            null,

          target_population:
            formData.target_population.trim() ||
            null,

          unit_of_analysis:
            formData.unit_of_analysis.trim() ||
            null,

          methodology_summary:
            formData.methodology_summary.trim() ||
            null,

          planned_start_date:
            formData.planned_start_date || null,

          planned_end_date:
            formData.planned_end_date || null,
        });

      setSuccessMessage(
        `${
          createdProject?.survey_name ||
          "Survey project"
        } was created successfully.`
      );

      setIsCreateModalOpen(false);
      setFormData(initialFormData);

      await loadSurveyEngine();
    } catch (error) {
      console.error(
        "Survey project creation failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to create the survey project."
      );
    } finally {
      setSavingProject(false);
    }
  }

  return (
    <MainLayout>
      <section className="survey-engine-page">
        <div className="survey-engine-page__header">
          <div>
            <span className="survey-engine-page__overline">
              Book III
            </span>

            <h1>Dynamic Survey Engine</h1>

            <p>
              Create, configure, publish, and manage
              multi-level Philippine survey projects without
              changing source code.
            </p>
          </div>

          <button
            type="button"
            className="survey-engine-page__create-button"
            onClick={openCreateModal}
          >
            Create Survey Project
          </button>
        </div>

        {errorMessage && (
          <div className="enterprise-foundation-state enterprise-foundation-state--error">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="survey-engine-message survey-engine-message--success">
            {successMessage}
          </div>
        )}

        <div className="survey-engine-page__summary">
          <article>
            <span>Total Surveys</span>

            <strong>
              {loading
                ? "..."
                : summary.total_surveys}
            </strong>
          </article>

          <article>
            <span>Draft</span>

            <strong>
              {loading
                ? "..."
                : summary.draft_surveys}
            </strong>
          </article>

          <article>
            <span>Published</span>

            <strong>
              {loading
                ? "..."
                : summary.published_surveys}
            </strong>
          </article>

          <article>
            <span>Field Operations</span>

            <strong>
              {loading
                ? "..."
                : summary.field_operation_surveys}
            </strong>
          </article>

          <article>
            <span>Closed</span>

            <strong>
              {loading
                ? "..."
                : summary.closed_surveys}
            </strong>
          </article>

          <article>
            <span>Coverage Levels</span>

            <strong>
              {loading
                ? "..."
                : summary.active_coverage_levels}
            </strong>
          </article>

          <article>
            <span>Executive Integration</span>

            <strong className="survey-engine-page__connected">
              {loading
                ? "Checking"
                : summary.executive_integration}
            </strong>
          </article>
        </div>

        <section className="survey-engine-panel">
          <div className="survey-engine-panel__header">
            <div>
              <span>Coverage Models</span>

              <h2>
                Supported Philippine Survey Levels
              </h2>
            </div>

            <strong>
              {loading
                ? "..."
                : `${coverageLevels.length} active`}
            </strong>
          </div>

          {loading ? (
            <div className="enterprise-foundation-state">
              Loading coverage levels...
            </div>
          ) : (
            <div className="survey-engine-coverage-grid">
              {coverageLevels.map(
                (coverageLevel) => (
                  <article
                    key={
                      coverageLevel.coverage_level_id
                    }
                    className="survey-engine-coverage-card"
                  >
                    <span>
                      {coverageLevel.coverage_code}
                    </span>

                    <h3>
                      {coverageLevel.coverage_name}
                    </h3>

                    <p>
                      {coverageLevel.description}
                    </p>

                    <div>
                      <small>
                        Stratification:{" "}
                        {coverageLevel
                          .requires_stratification
                          ? "Required"
                          : "Optional"}
                      </small>

                      <small>
                        Multiple roots:{" "}
                        {coverageLevel
                          .allows_multiple_root_units
                          ? "Allowed"
                          : "Single root"}
                      </small>
                    </div>
                  </article>
                )
              )}
            </div>
          )}
        </section>

        <section className="survey-engine-panel">
          <div className="survey-engine-panel__header">
            <div>
              <span>Project Registry</span>

              <h2>Survey Projects</h2>
            </div>

            <strong>
              {loading
                ? "..."
                : `${projects.length} records`}
            </strong>
          </div>

          {loading ? (
            <div className="enterprise-foundation-state">
              Loading survey projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="enterprise-foundation-state">
              No survey projects have been created yet.
            </div>
          ) : (
            <div className="survey-engine-table-wrapper">
              <table className="survey-engine-table">
                <thead>
                  <tr>
                    <th>Survey</th>
                    <th>Coverage</th>
                    <th>Organization</th>
                    <th>Status</th>
                    <th>Period</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {projects.map((project) => (
                    <tr key={project.survey_id}>
                      <td>
                        <strong>
                          {project.survey_name}
                        </strong>

                        <span>
                          {project.survey_code}
                        </span>
                      </td>

                      <td>
                        {project.coverage_name ||
                          "Not configured"}
                      </td>

                      <td>
                        {project.organization_short_name ||
                          project.organization_name ||
                          "Not assigned"}
                      </td>

                      <td>
                        {project.publication_status}
                      </td>

                      <td>
                        {project.planned_start_date ||
                          "—"}
                        {" to "}
                        {project.planned_end_date ||
                          "—"}
                      </td>

                      <td>
                        {project.updated_at
                          ? new Date(
                              project.updated_at
                            ).toLocaleString()
                          : "—"}
                      </td>

<td>
  <button
    type="button"
    className="survey-engine-action-button"
    onClick={() =>
      navigate(
        `/survey-builder/${project.survey_id}/designer`
      )
    }
  >
    Open Designer
  </button>
</td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {isCreateModalOpen && (
          <div
            className="survey-project-modal"
            role="presentation"
          >
            <div
              className="survey-project-modal__backdrop"
              onClick={closeCreateModal}
              role="presentation"
            />

            <section
              className="survey-project-modal__dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-survey-title"
            >
              <div className="survey-project-modal__header">
                <div>
                  <span>
                    No-Code Survey Configuration
                  </span>

                  <h2 id="create-survey-title">
                    Create Survey Project
                  </h2>

                  <p>
                    Establish the project identity,
                    geographic coverage level, research
                    purpose, and planned period.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={savingProject}
                  aria-label="Close survey creation form"
                >
                  ×
                </button>
              </div>

              <form
                className="survey-project-form"
                onSubmit={handleCreateProject}
              >
                <div className="survey-project-form__grid">
                  <label className="survey-project-form__field survey-project-form__field--wide">
                    <span>
                      Survey Project Name *
                    </span>

                    <input
                      type="text"
                      name="survey_name"
                      value={formData.survey_name}
                      onChange={handleInputChange}
                      placeholder="Example: Iligan City Governance Survey"
                      required
                    />
                  </label>

                  <label className="survey-project-form__field">
                    <span>
                      Survey Code
                    </span>

                    <input
                      type="text"
                      name="survey_code"
                      value={formData.survey_code}
                      onChange={handleInputChange}
                      placeholder="Automatically generated"
                    />

                    <small>
                      Leave blank to generate a unique
                      survey code automatically.
                    </small>
                  </label>

                  <label className="survey-project-form__field">
                    <span>
                      Survey Coverage Level *
                    </span>

                    <select
                      name="coverage_level_id"
                      value={
                        formData.coverage_level_id
                      }
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">
                        Select coverage level
                      </option>

                      {coverageLevels.map(
                        (coverageLevel) => (
                          <option
                            key={
                              coverageLevel.coverage_level_id
                            }
                            value={
                              coverageLevel.coverage_level_id
                            }
                          >
                            {
                              coverageLevel.coverage_name
                            }
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  {selectedCoverageLevel && (
                    <div className="survey-project-form__coverage-note survey-project-form__field--wide">
                      <strong>
                        {
                          selectedCoverageLevel.coverage_name
                        }
                      </strong>

                      <p>
                        {
                          selectedCoverageLevel.description
                        }
                      </p>

                      <span>
                        Stratification:{" "}
                        {selectedCoverageLevel
                          .requires_stratification
                          ? "Required"
                          : "Optional"}
                      </span>
                    </div>
                  )}

                  <label className="survey-project-form__field survey-project-form__field--wide">
                    <span>
                      Survey Purpose
                    </span>

                    <input
                      type="text"
                      name="survey_purpose"
                      value={
                        formData.survey_purpose
                      }
                      onChange={handleInputChange}
                      placeholder="Example: Governance satisfaction and public opinion"
                    />
                  </label>

                  <label className="survey-project-form__field survey-project-form__field--wide">
                    <span>
                      Project Description
                    </span>

                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Brief description of the survey project"
                    />
                  </label>

                  <label className="survey-project-form__field survey-project-form__field--wide">
                    <span>
                      Research Objectives
                    </span>

                    <textarea
                      name="research_objectives"
                      value={
                        formData.research_objectives
                      }
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="State the principal research objectives"
                    />
                  </label>

                  <label className="survey-project-form__field">
                    <span>
                      Target Population
                    </span>

                    <input
                      type="text"
                      name="target_population"
                      value={
                        formData.target_population
                      }
                      onChange={handleInputChange}
                      placeholder="Example: Registered voters aged 18 and above"
                    />
                  </label>

                  <label className="survey-project-form__field">
                    <span>
                      Unit of Analysis
                    </span>

                    <input
                      type="text"
                      name="unit_of_analysis"
                      value={
                        formData.unit_of_analysis
                      }
                      onChange={handleInputChange}
                      placeholder="Example: Individual respondent"
                    />
                  </label>

                  <label className="survey-project-form__field survey-project-form__field--wide">
                    <span>
                      Methodology Summary
                    </span>

                    <textarea
                      name="methodology_summary"
                      value={
                        formData.methodology_summary
                      }
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Initial sampling or research methodology"
                    />
                  </label>

                  <label className="survey-project-form__field">
                    <span>
                      Planned Start Date
                    </span>

                    <input
                      type="date"
                      name="planned_start_date"
                      value={
                        formData.planned_start_date
                      }
                      onChange={handleInputChange}
                    />
                  </label>

                  <label className="survey-project-form__field">
                    <span>
                      Planned End Date
                    </span>

                    <input
                      type="date"
                      name="planned_end_date"
                      value={
                        formData.planned_end_date
                      }
                      onChange={handleInputChange}
                      min={
                        formData.planned_start_date ||
                        undefined
                      }
                    />
                  </label>
                </div>

                <div className="survey-project-form__actions">
                  <button
                    type="button"
                    onClick={closeCreateModal}
                    disabled={savingProject}
                    className="survey-project-form__cancel"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={savingProject}
                    className="survey-project-form__submit"
                  >
                    {savingProject
                      ? "Creating Survey Project..."
                      : "Create Survey Project"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    </MainLayout>
  );
}