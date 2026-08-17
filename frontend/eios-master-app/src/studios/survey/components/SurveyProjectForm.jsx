import { useEffect, useState } from "react";

import "./SurveyProjectForm.css";

const initialForm = {
  survey_code: "",
  survey_name: "",
  description: "",
  survey_purpose: "",
  coverage_level_id: "",
  organization_id: "",
  planned_start_date: "",
  planned_end_date: "",
  publication_status: "Draft",
};

export default function SurveyProjectForm({
  value = null,
  coverageLevels = [],
  organizations = [],
  submitting = false,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!value) {
      setForm(initialForm);
      setErrors({});
      return;
    }

    setForm({
      survey_code: value.survey_code || "",
      survey_name: value.survey_name || "",
      description: value.description || "",
      survey_purpose: value.survey_purpose || "",
      coverage_level_id:
        value.coverage_level_id || "",
      organization_id:
        value.organization_id || "",
      planned_start_date:
        value.planned_start_date
          ? String(value.planned_start_date).slice(0, 10)
          : "",
      planned_end_date:
        value.planned_end_date
          ? String(value.planned_end_date).slice(0, 10)
          : "",
      publication_status:
        value.publication_status || "Draft",
    });

    setErrors({});
  }, [value]);

  function updateField(field, nextValue) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: nextValue,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.survey_code.trim()) {
      nextErrors.survey_code =
        "Survey code is required.";
    }

    if (!form.survey_name.trim()) {
      nextErrors.survey_name =
        "Survey name is required.";
    }

    if (!form.coverage_level_id) {
      nextErrors.coverage_level_id =
        "Coverage level is required.";
    }

    if (
      form.planned_start_date &&
      form.planned_end_date &&
      form.planned_end_date <
        form.planned_start_date
    ) {
      nextErrors.planned_end_date =
        "End date cannot be earlier than the start date.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit?.({
      survey_code: form.survey_code.trim(),
      survey_name: form.survey_name.trim(),
      description: form.description.trim(),
      survey_purpose:
        form.survey_purpose.trim(),
      coverage_level_id:
        form.coverage_level_id || null,
      organization_id:
        form.organization_id || null,
      planned_start_date:
        form.planned_start_date || null,
      planned_end_date:
        form.planned_end_date || null,
      publication_status:
        form.publication_status,
    });
  }

  return (
    <form
      className="survey-project-form"
      onSubmit={handleSubmit}
    >
      <div className="survey-project-form__grid">
        <label className="survey-project-form__field">
          <span>Survey Code</span>

          <input
            type="text"
            value={form.survey_code}
            onChange={(event) =>
              updateField(
                "survey_code",
                event.target.value
              )
            }
            placeholder="Example: BPOS-2026-001"
            disabled={submitting}
          />

          {errors.survey_code && (
            <small className="survey-project-form__error">
              {errors.survey_code}
            </small>
          )}
        </label>

        <label className="survey-project-form__field">
          <span>Publication Status</span>

          <select
            value={form.publication_status}
            onChange={(event) =>
              updateField(
                "publication_status",
                event.target.value
              )
            }
            disabled={submitting}
          >
            <option value="Draft">
              Draft
            </option>

            <option value="Published">
              Published
            </option>

            <option value="Field Operations">
              Field Operations
            </option>

            <option value="Closed">
              Closed
            </option>
          </select>
        </label>

        <label className="survey-project-form__field survey-project-form__field--full">
          <span>Survey Name</span>

          <input
            type="text"
            value={form.survey_name}
            onChange={(event) =>
              updateField(
                "survey_name",
                event.target.value
              )
            }
            placeholder="Enter the complete survey title"
            disabled={submitting}
          />

          {errors.survey_name && (
            <small className="survey-project-form__error">
              {errors.survey_name}
            </small>
          )}
        </label>

        <label className="survey-project-form__field survey-project-form__field--full">
          <span>Description</span>

          <textarea
            rows="3"
            value={form.description}
            onChange={(event) =>
              updateField(
                "description",
                event.target.value
              )
            }
            placeholder="Describe the survey project."
            disabled={submitting}
          />
        </label>

        <label className="survey-project-form__field survey-project-form__field--full">
          <span>Survey Purpose</span>

          <textarea
            rows="3"
            value={form.survey_purpose}
            onChange={(event) =>
              updateField(
                "survey_purpose",
                event.target.value
              )
            }
            placeholder="Explain what the survey should accomplish."
            disabled={submitting}
          />
        </label>

        <label className="survey-project-form__field">
          <span>Coverage Level</span>

          <select
            value={form.coverage_level_id}
            onChange={(event) =>
              updateField(
                "coverage_level_id",
                event.target.value
              )
            }
            disabled={submitting}
          >
            <option value="">
              Select coverage
            </option>

            {coverageLevels.map((level) => (
              <option
                key={level.coverage_level_id}
                value={level.coverage_level_id}
              >
                {level.coverage_name}
              </option>
            ))}
          </select>

          {errors.coverage_level_id && (
            <small className="survey-project-form__error">
              {errors.coverage_level_id}
            </small>
          )}
        </label>

        <label className="survey-project-form__field">
          <span>Organization</span>

          <select
            value={form.organization_id}
            onChange={(event) =>
              updateField(
                "organization_id",
                event.target.value
              )
            }
            disabled={submitting}
          >
            <option value="">
              Not assigned
            </option>

            {organizations.map((organization) => (
              <option
                key={organization.organization_id}
                value={organization.organization_id}
              >
                {organization.organization_name}
              </option>
            ))}
          </select>
        </label>

        <label className="survey-project-form__field">
          <span>Planned Start Date</span>

          <input
            type="date"
            value={form.planned_start_date}
            onChange={(event) =>
              updateField(
                "planned_start_date",
                event.target.value
              )
            }
            disabled={submitting}
          />
        </label>

        <label className="survey-project-form__field">
          <span>Planned End Date</span>

          <input
            type="date"
            value={form.planned_end_date}
            onChange={(event) =>
              updateField(
                "planned_end_date",
                event.target.value
              )
            }
            disabled={submitting}
          />

          {errors.planned_end_date && (
            <small className="survey-project-form__error">
              {errors.planned_end_date}
            </small>
          )}
        </label>
      </div>

      <div className="survey-project-form__actions">
        <button
          type="button"
          className="eeui-button eeui-button--secondary eeui-button--medium"
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </button>

        <button
          type="submit"
          className="eeui-button eeui-button--primary eeui-button--medium"
          disabled={submitting}
        >
          {submitting
            ? "Saving..."
            : value
              ? "Save Changes"
              : "Create Survey"}
        </button>
      </div>
    </form>
  );
}