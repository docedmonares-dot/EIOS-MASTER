import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  Save,
  X,
} from "lucide-react";

import {
  EEUIButton,
} from "../button";

import "./EnterpriseQuestionInspector.css";

const inspectorTabs = [
  "General",
  "Validation",
  "Logic",
  "Options",
  "Appearance",
  "Advanced",
];

const initialForm = {
  question_type_id: "",
  section_id: "",
  question_text: "",
  variable_name: "",
  question_description: "",
  help_text: "",
  placeholder_text: "",
  required_flag: false,
  is_sensitive: false,
  is_personally_identifiable: false,
  page_number: 1,
  sort_order: 0,
  choice_list_id: "",
  choice_options: [],
  settings_json: {},
  item_settings_json: { is_applicable: true },
};

function normalizeItem(item) {
  if (!item) {
    return initialForm;
  }

  return {
    question_type_id:
      item.question_type_id || "",

    section_id:
      item.section_id || "",

    question_text:
      item.question_text || "",

    variable_name:
      item.variable_name || "",

    question_description:
      item.question_description || "",

    help_text:
      item.help_text || "",

    placeholder_text:
      item.placeholder_text || "",

    required_flag:
      Boolean(item.required_flag),

    is_sensitive:
      Boolean(item.is_sensitive),

    is_personally_identifiable:
      Boolean(
        item.is_personally_identifiable
      ),

    page_number:
      Number(item.page_number || 1),

    sort_order:
      Number(item.sort_order || 0),

    choice_list_id:
      item.choice_list_id || "",

    choice_options: Array.isArray(
      item.choice_options
    )
      ? item.choice_options.map((option) => ({
          ...option,
        }))
      : [],

    settings_json:
      item.settings_json &&
      typeof item.settings_json === "object"
        ? JSON.parse(
            JSON.stringify(item.settings_json)
          )
        : {},

    item_settings_json:
      item.item_settings_json &&
      typeof item.item_settings_json === "object"
        ? JSON.parse(JSON.stringify(item.item_settings_json))
        : { is_applicable: true },
  };
}

export default function EnterpriseQuestionInspector({
  item = null,
  sections = [],
  questionTypes = [],
  saving = false,
  errorMessage = "",
  onSave,
  onCancel,
}) {
  const [activeTab, setActiveTab] =
    useState("General");

  const [form, setForm] =
    useState(initialForm);

  const [errors, setErrors] =
    useState({});

  useEffect(() => {
    setForm(normalizeItem(item));
    setErrors({});
    setActiveTab("General");
  }, [item]);

  const dirty = useMemo(() => {
    if (!item) {
      return false;
    }

    return (
      JSON.stringify(form) !==
      JSON.stringify(normalizeItem(item))
    );
  }, [form, item]);

  function updateField(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: "",
    }));
  }

  function validate() {
    const nextErrors = {};

    if (!form.question_text.trim()) {
      nextErrors.question_text =
        "Question text is required.";
    }

    if (!form.variable_name.trim()) {
      nextErrors.variable_name =
        "Variable name is required.";
    }

    if (!form.question_type_id) {
      nextErrors.question_type_id =
        "Question type is required.";
    }

    if (
      Number(form.page_number) < 1
    ) {
      nextErrors.page_number =
        "Page number must be at least 1.";
    }

    if (
      Number(form.sort_order) < 0
    ) {
      nextErrors.sort_order =
        "Sort order cannot be negative.";
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors).length === 0
    );
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    onSave?.({
      section_id:
        form.section_id || null,

      question_type_id:
        form.question_type_id,

      question_text:
        form.question_text.trim(),

      variable_name:
        form.variable_name.trim(),

      question_description:
        form.question_description.trim(),

      help_text:
        form.help_text.trim(),

      placeholder_text:
        form.placeholder_text.trim(),

      required_flag:
        Boolean(form.required_flag),

      is_sensitive:
        Boolean(form.is_sensitive),

      is_personally_identifiable:
        Boolean(
          form.is_personally_identifiable
        ),

      page_number:
        Number(form.page_number || 1),

      sort_order:
        Number(form.sort_order || 0),

      choice_list_id:
        form.choice_list_id || null,

      choice_options:
        form.choice_options,

      settings_json:
        form.settings_json,

      item_settings_json:
        form.item_settings_json,
    });
  }

  function updateChoiceOption(
    optionIndex,
    field,
    value
  ) {
    updateField(
      "choice_options",
      form.choice_options.map(
        (option, index) =>
          index === optionIndex
            ? {
                ...option,
                [field]: value,
              }
            : option
      )
    );
  }

  function addChoiceOption() {
    const nextIndex =
      form.choice_options.length + 1;
    const optionCode =
      `CANDIDATE_${Date.now()}`;

    updateField("choice_options", [
      ...form.choice_options,
      {
        option_code: optionCode,
        option_value: optionCode,
        option_label: `Candidate ${nextIndex}`,
        sort_order: nextIndex,
        is_none_option: false,
        is_active: true,
      },
    ]);
  }

  function removeChoiceOption(optionIndex) {
    updateField(
      "choice_options",
      form.choice_options.filter(
        (_, index) => index !== optionIndex
      )
    );
  }

  function updateElectionSetting(field, value) {
    updateField("settings_json", {
      ...form.settings_json,
      election_position: {
        ...(form.settings_json
          ?.election_position || {}),
        [field]: value,
      },
    });
  }

  function handleCancel() {
    setForm(normalizeItem(item));
    setErrors({});
    onCancel?.();
  }

  if (!item) {
    return (
      <section className="enterprise-question-inspector">
        <div className="enterprise-question-inspector__empty">
          <AlertCircle
            size={26}
            aria-hidden="true"
          />

          <strong>
            No question selected
          </strong>

          <span>
            Select a question from the
            questionnaire canvas to edit its
            properties.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="enterprise-question-inspector">
      <header className="enterprise-question-inspector__header">
        <div>
          <span>
            Enterprise Question Inspector
          </span>

          <h2>
            {item.question_code ||
              "Question Properties"}
          </h2>

          <p>
            {item.item_source ||
              "Questionnaire Item"}
          </p>
        </div>

        {dirty && (
          <span className="enterprise-question-inspector__dirty">
            Unsaved changes
          </span>
        )}
      </header>

      <nav className="enterprise-question-inspector__tabs">
        {inspectorTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() =>
              setActiveTab(tab)
            }
            className={
              activeTab === tab
                ? "enterprise-question-inspector__tab enterprise-question-inspector__tab--active"
                : "enterprise-question-inspector__tab"
            }
          >
            {tab}
          </button>
        ))}
      </nav>

      {errorMessage && (
        <div className="enterprise-question-inspector__error">
          {errorMessage}
        </div>
      )}

      {activeTab === "General" ? (
        <form
          className="enterprise-question-inspector__form"
          onSubmit={handleSubmit}
        >
          <div className="enterprise-question-inspector__grid">
            <label className="enterprise-question-inspector__field enterprise-question-inspector__field--full">
              <span>Question Text</span>

              <textarea
                rows="4"
                value={form.question_text}
                onChange={(event) =>
                  updateField(
                    "question_text",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              {errors.question_text && (
                <small>
                  {errors.question_text}
                </small>
              )}
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Variable Name</span>

              <input
                type="text"
                value={form.variable_name}
                onChange={(event) =>
                  updateField(
                    "variable_name",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              {errors.variable_name && (
                <small>
                  {errors.variable_name}
                </small>
              )}
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Question Type</span>

              <select
                value={form.question_type_id}
                onChange={(event) =>
                  updateField(
                    "question_type_id",
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="">
                  Select question type
                </option>

                {questionTypes.map(
                  (questionType) => (
                    <option
                      key={
                        questionType.question_type_id
                      }
                      value={
                        questionType.question_type_id
                      }
                    >
                      {questionType.category_group}
                      {" — "}
                      {questionType.type_name}
                    </option>
                  )
                )}
              </select>

              {errors.question_type_id && (
                <small>
                  {errors.question_type_id}
                </small>
              )}
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Section</span>

              <select
                value={form.section_id}
                onChange={(event) =>
                  updateField(
                    "section_id",
                    event.target.value
                  )
                }
                disabled={saving}
              >
                <option value="">
                  Unassigned Questions
                </option>

                {sections.map((section) => (
                  <option
                    key={section.section_id}
                    value={section.section_id}
                  >
                    {section.section_title}
                  </option>
                ))}
              </select>
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Placeholder</span>

              <input
                type="text"
                value={form.placeholder_text}
                onChange={(event) =>
                  updateField(
                    "placeholder_text",
                    event.target.value
                  )
                }
                disabled={saving}
              />
            </label>

            <label className="enterprise-question-inspector__field enterprise-question-inspector__field--full">
              <span>Description</span>

              <textarea
                rows="3"
                value={
                  form.question_description
                }
                onChange={(event) =>
                  updateField(
                    "question_description",
                    event.target.value
                  )
                }
                disabled={saving}
              />
            </label>

            <label className="enterprise-question-inspector__field enterprise-question-inspector__field--full">
              <span>Help Text</span>

              <textarea
                rows="3"
                value={form.help_text}
                onChange={(event) =>
                  updateField(
                    "help_text",
                    event.target.value
                  )
                }
                disabled={saving}
              />
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Page Number</span>

              <input
                type="number"
                min="1"
                value={form.page_number}
                onChange={(event) =>
                  updateField(
                    "page_number",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              {errors.page_number && (
                <small>
                  {errors.page_number}
                </small>
              )}
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Sort Order</span>

              <input
                type="number"
                min="0"
                value={form.sort_order}
                onChange={(event) =>
                  updateField(
                    "sort_order",
                    event.target.value
                  )
                }
                disabled={saving}
              />

              {errors.sort_order && (
                <small>
                  {errors.sort_order}
                </small>
              )}
            </label>

            <label className="enterprise-question-inspector__check">
              <input
                type="checkbox"
                checked={form.required_flag}
                onChange={(event) =>
                  updateField(
                    "required_flag",
                    event.target.checked
                  )
                }
                disabled={saving}
              />

              <span>Required response</span>
            </label>

            <label className="enterprise-question-inspector__check">
              <input
                type="checkbox"
                checked={form.is_sensitive}
                onChange={(event) =>
                  updateField(
                    "is_sensitive",
                    event.target.checked
                  )
                }
                disabled={saving}
              />

              <span>Sensitive information</span>
            </label>

            <label className="enterprise-question-inspector__check enterprise-question-inspector__field--full">
              <input
                type="checkbox"
                checked={
                  form.is_personally_identifiable
                }
                onChange={(event) =>
                  updateField(
                    "is_personally_identifiable",
                    event.target.checked
                  )
                }
                disabled={saving}
              />

              <span>
                Personally identifiable
                information
              </span>
            </label>
          </div>

          <footer className="enterprise-question-inspector__actions">
            <EEUIButton
              type="button"
              variant="secondary"
              icon={X}
              onClick={handleCancel}
              disabled={
                saving || !dirty
              }
            >
              Cancel
            </EEUIButton>

            <EEUIButton
              type="submit"
              icon={Save}
              loading={saving}
              disabled={
                saving || !dirty
              }
            >
              Save Changes
            </EEUIButton>
          </footer>
        </form>
      ) : activeTab === "Options" &&
        form.choice_list_id ? (
        <form
          className="enterprise-question-inspector__form"
          onSubmit={handleSubmit}
        >
          <div className="enterprise-question-inspector__grid">
            <div className="enterprise-question-inspector__field enterprise-question-inspector__field--full">
              <span>Position Applicability</span>
              <p style={{ margin: "6px 0 10px" }}>
                A position marked Not Applicable is omitted from AST,
                the ballot, tenacity questions, preview, and Enumerator
                interviews without deleting its configuration.
              </p>
              <EEUIButton
                type="button"
                variant={
                  form.settings_json?.election_position
                    ?.is_applicable === false
                    ? "primary"
                    : "secondary"
                }
                onClick={() =>
                  updateElectionSetting(
                    "is_applicable",
                    form.settings_json?.election_position
                      ?.is_applicable === false
                  )
                }
                disabled={saving}
              >
                {form.settings_json?.election_position
                  ?.is_applicable === false
                  ? "Not Applicable — Click to Include Position"
                  : "Mark Position as Not Applicable"}
              </EEUIButton>
            </div>

            <label className="enterprise-question-inspector__field">
              <span>Position Name</span>
              <input
                type="text"
                value={
                  form.settings_json
                    ?.election_position
                    ?.position_name || ""
                }
                onChange={(event) =>
                  updateElectionSetting(
                    "position_name",
                    event.target.value
                  )
                }
                disabled={saving}
              />
            </label>

            <label className="enterprise-question-inspector__field">
              <span>Maximum Selections</span>
              <input
                type="number"
                min="1"
                value={
                  form.settings_json
                    ?.election_position
                    ?.max_selections || 1
                }
                onChange={(event) =>
                  updateElectionSetting(
                    "max_selections",
                    Number(event.target.value || 1)
                  )
                }
                disabled={saving}
              />
            </label>

            <div className="enterprise-question-inspector__field enterprise-question-inspector__field--full">
              <span>Editable Candidate Roster</span>

              {form.choice_options.map(
                (option, optionIndex) => (
                  <div
                    key={
                      option.option_code ||
                      optionIndex
                    }
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "minmax(0, 1fr) auto",
                      gap: "8px",
                      marginTop: "8px",
                    }}
                  >
                    <input
                      type="text"
                      value={
                        option.option_label || ""
                      }
                      onChange={(event) =>
                        updateChoiceOption(
                          optionIndex,
                          "option_label",
                          event.target.value
                        )
                      }
                      disabled={saving}
                    />

                    <EEUIButton
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        removeChoiceOption(
                          optionIndex
                        )
                      }
                      disabled={
                        saving ||
                        String(
                          option.option_code || ""
                        ).toUpperCase() ===
                          "UNDECIDED"
                      }
                    >
                      Remove
                    </EEUIButton>
                  </div>
                )
              )}

              <EEUIButton
                type="button"
                variant="secondary"
                onClick={addChoiceOption}
                disabled={saving}
                style={{ marginTop: "10px" }}
              >
                Add Candidate
              </EEUIButton>
            </div>
          </div>

          <footer className="enterprise-question-inspector__actions">
            <EEUIButton
              type="button"
              variant="secondary"
              icon={X}
              onClick={handleCancel}
              disabled={saving || !dirty}
            >
              Cancel
            </EEUIButton>

            <EEUIButton
              type="submit"
              icon={Save}
              loading={saving}
              disabled={saving || !dirty}
            >
              Save Options
            </EEUIButton>
          </footer>
        </form>
      ) : (
        <div className="enterprise-question-inspector__placeholder">
          <strong>{activeTab}</strong>

          <span>
            This property tab will be
            activated in a later sprint.
          </span>
        </div>
      )}
    </section>
  );
}
