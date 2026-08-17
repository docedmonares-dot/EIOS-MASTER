import {
  BadgeCheck,
  Database,
  Fingerprint,
  ShieldAlert,
  Tag,
} from "lucide-react";

function FieldGroup({
  label,
  children,
  hint,
}) {
  return (
    <div
      style={{
        display: "grid",
        gap: "6px",
      }}
    >
      <label
        style={{
          fontWeight: 700,
          fontSize: "13px",
          color: "#0f172a",
        }}
      >
        {label}
      </label>

      {children}

      {hint && (
        <small
          style={{
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {hint}
        </small>
      )}
    </div>
  );
}

function CheckboxField({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label
      style={{
        display: "flex",
        gap: "10px",
        alignItems: "flex-start",
        padding: "12px",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        background: "#ffffff",
        cursor: disabled
          ? "not-allowed"
          : "pointer",
      }}
    >
      <input
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(event) => {
          onChange?.(event.target.checked);
        }}
      />

      <span
        style={{
          display: "grid",
          gap: "3px",
        }}
      >
        <strong>{label}</strong>

        <small
          style={{
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          {description}
        </small>
      </span>
    </label>
  );
}

export default function GeneralBuilder({
  question,
  onChange,
  questionTypes = [],
  categories = [],
  readOnly = false,
}) {
  const workingQuestion = question || {};

  function updateField(
    fieldName,
    value
  ) {
    if (readOnly) {
      return;
    }

    onChange?.({
      ...workingQuestion,
      [fieldName]: value,
    });
  }

  return (
    <section
      style={{
        display: "grid",
        gap: "22px",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "20px",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div>
          <span className="enterprise-question-editor__eyebrow">
            Enterprise Question Identity
          </span>

          <h2
            style={{
              margin: "5px 0 6px",
            }}
          >
            General
          </h2>

          <p
            style={{
              margin: 0,
              color: "#64748b",
              maxWidth: "760px",
              lineHeight: 1.6,
            }}
          >
            Define the governed identity,
            classification, lifecycle, and
            data-governance attributes of this
            Enterprise Question Object.
          </p>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            border: "1px solid #dbeafe",
            borderRadius: "999px",
            background: "#eff6ff",
            fontSize: "13px",
            fontWeight: 700,
          }}
        >
          <BadgeCheck size={16} />
          General Metadata
        </div>
      </header>

      <section
        style={{
          padding: "18px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#f8fafc",
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Fingerprint size={18} />

          <h3
            style={{
              margin: 0,
            }}
          >
            Identity
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          <FieldGroup
            label="Question Code"
            hint="Unique enterprise identifier for this reusable question."
          >
            <input
              type="text"
              value={
                workingQuestion.question_code ||
                ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateField(
                  "question_code",
                  event.target.value
                );
              }}
              placeholder="Example: DEMO_AGE_001"
            />
          </FieldGroup>

          <FieldGroup
            label="Variable Name"
            hint="Machine-readable variable used in datasets, exports, analytics, and statistical systems."
          >
            <input
              type="text"
              value={
                workingQuestion.variable_name ||
                ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateField(
                  "variable_name",
                  event.target.value
                );
              }}
              placeholder="Example: respondent_age"
            />
          </FieldGroup>
        </div>

        <FieldGroup
          label="Question Text"
          hint="The primary question wording presented to the respondent or enumerator."
        >
          <textarea
            rows={4}
            value={
              workingQuestion.question_text ||
              ""
            }
            disabled={readOnly}
            onChange={(event) => {
              updateField(
                "question_text",
                event.target.value
              );
            }}
            placeholder="Enter the complete question text."
          />
        </FieldGroup>

        <FieldGroup
          label="Description"
          hint="Internal description explaining the purpose or intended use of the question."
        >
          <textarea
            rows={3}
            value={
              workingQuestion.question_description ||
              ""
            }
            disabled={readOnly}
            onChange={(event) => {
              updateField(
                "question_description",
                event.target.value
              );
            }}
            placeholder="Describe the purpose of this Enterprise Question Object."
          />
        </FieldGroup>
      </section>

      <section
        style={{
          padding: "18px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#ffffff",
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Tag size={18} />

          <h3
            style={{
              margin: 0,
            }}
          >
            Classification
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <FieldGroup label="Question Type">
            <select
              value={
                workingQuestion.question_type_id ||
                ""
              }
              disabled={readOnly}
              onChange={(event) => {
                const selectedType =
                  questionTypes.find(
                    (item) =>
                      item.question_type_id ===
                      event.target.value
                  );

                onChange?.({
                  ...workingQuestion,
                  question_type_id:
                    event.target.value || null,
                  question_type:
                    selectedType?.type_code ||
                    workingQuestion.question_type ||
                    "",
                });
              }}
            >
              <option value="">
                Select Question Type
              </option>

              {questionTypes.map((type) => (
                <option
                  key={type.question_type_id}
                  value={type.question_type_id}
                >
                  {type.type_name}
                </option>
              ))}
            </select>
          </FieldGroup>

          <FieldGroup label="Category">
            <select
              value={
                workingQuestion.question_category_id ||
                ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateField(
                  "question_category_id",
                  event.target.value || null
                );
              }}
            >
              <option value="">
                Select Category
              </option>

              {categories.map(
                (category) => (
                  <option
                    key={
                      category.category_id
                    }
                    value={
                      category.category_id
                    }
                  >
                    {
                      category.category_name
                    }
                  </option>
                )
              )}
            </select>
          </FieldGroup>

          <FieldGroup label="Module">
            <input
              type="text"
              value={
                workingQuestion.question_module ||
                ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateField(
                  "question_module",
                  event.target.value
                );
              }}
              placeholder="Example: Demographics"
            />
          </FieldGroup>

          <FieldGroup label="Group">
            <input
              type="text"
              value={
                workingQuestion.question_group ||
                ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateField(
                  "question_group",
                  event.target.value
                );
              }}
              placeholder="Example: Personal Profile"
            />
          </FieldGroup>
        </div>
      </section>

      <section
        style={{
          padding: "18px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#ffffff",
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <Database size={18} />

          <h3
            style={{
              margin: 0,
            }}
          >
            Lifecycle &amp; Governance
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
          }}
        >
          <FieldGroup label="Status">
            <select
              value={
                workingQuestion.question_status ||
                "Draft"
              }
              disabled={readOnly}
              onChange={(event) => {
                updateField(
                  "question_status",
                  event.target.value
                );
              }}
            >
              <option value="Draft">
                Draft
              </option>

              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>

              <option value="Archived">
                Archived
              </option>
            </select>
          </FieldGroup>

          <FieldGroup label="Version">
            <input
              type="text"
              value={
                workingQuestion.version_number ??
                1
              }
              disabled
            />
          </FieldGroup>

          <FieldGroup label="Question UUID">
            <input
              type="text"
              value={
                workingQuestion.question_id ||
                "Assigned upon creation"
              }
              disabled
            />
          </FieldGroup>
        </div>
      </section>

      <section
        style={{
          padding: "18px",
          border: "1px solid #e2e8f0",
          borderRadius: "12px",
          background: "#ffffff",
          display: "grid",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
          }}
        >
          <ShieldAlert size={18} />

          <h3
            style={{
              margin: 0,
            }}
          >
            Data Governance
          </h3>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "12px",
          }}
        >
          <CheckboxField
            label="Required Response"
            description="The respondent or enumerator must provide a value before proceeding when applicable."
            checked={
              workingQuestion.required_flag
            }
            disabled={readOnly}
            onChange={(checked) => {
              updateField(
                "required_flag",
                checked
              );
            }}
          />

          <CheckboxField
            label="Sensitive Data"
            description="Marks this question as containing data that requires enhanced protection or governance."
            checked={
              workingQuestion.is_sensitive
            }
            disabled={readOnly}
            onChange={(checked) => {
              updateField(
                "is_sensitive",
                checked
              );
            }}
          />

          <CheckboxField
            label="Personally Identifiable Information"
            description="Marks the response as information capable of identifying or materially linking to an individual."
            checked={
              workingQuestion.is_personally_identifiable
            }
            disabled={readOnly}
            onChange={(checked) => {
              updateField(
                "is_personally_identifiable",
                checked
              );
            }}
          />
        </div>
      </section>

      <section
        style={{
          padding: "16px 18px",
          border: "1px dashed #cbd5e1",
          borderRadius: "12px",
          background: "#f8fafc",
          display: "grid",
          gap: "8px",
        }}
      >
        <strong>
          Enterprise Audit Metadata
        </strong>

        <span>
          Created:{" "}
          {workingQuestion.created_at ||
            "Not yet created"}
        </span>

        <span>
          Updated:{" "}
          {workingQuestion.updated_at ||
            "Not yet updated"}
        </span>

        <span>
          Created By:{" "}
          {workingQuestion.created_by ||
            "Assigned by backend"}
        </span>

        <span>
          Updated By:{" "}
          {workingQuestion.updated_by ||
            "Assigned by backend"}
        </span>
      </section>
    </section>
  );
}