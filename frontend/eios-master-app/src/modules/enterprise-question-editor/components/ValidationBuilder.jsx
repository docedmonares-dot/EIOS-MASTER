export default function ValidationBuilder({
  question,
  questionTypeMetadata,
  onChange,
  readOnly = false,
}) {
  const allowedRules =
    Array.isArray(
      questionTypeMetadata?.allowed_validation_rules
    )
      ? questionTypeMetadata.allowed_validation_rules
      : [];

  const validationRules =
    question?.validation_rules_json &&
    typeof question.validation_rules_json === "object" &&
    !Array.isArray(question.validation_rules_json)
      ? question.validation_rules_json
      : {};

  function updateRule(ruleName, value) {
    onChange((currentQuestion) => ({
      ...currentQuestion,
      validation_rules_json: {
        ...(currentQuestion.validation_rules_json &&
        typeof currentQuestion.validation_rules_json === "object" &&
        !Array.isArray(
          currentQuestion.validation_rules_json
        )
          ? currentQuestion.validation_rules_json
          : {}),
        [ruleName]: value,
      },
    }));
  }

  function updateRequired(value) {
    onChange((currentQuestion) => ({
      ...currentQuestion,
      required_flag: value,
    }));
  }

  return (
    <div className="enterprise-question-editor__section-panel">
      <div className="enterprise-question-editor__section-heading">
        <div>
          <span className="enterprise-question-editor__eyebrow">
            Metadata-Driven Validation
          </span>

          <h2>Validation</h2>

          <p>
            Configure only the validation rules supported
            by the selected Question Type.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        {allowedRules.includes("required") && (
          <label>
            <input
              type="checkbox"
              checked={Boolean(
                question?.required_flag
              )}
              disabled={readOnly}
              onChange={(event) => {
                updateRequired(
                  event.target.checked
                );
              }}
            />{" "}
            Required Response
          </label>
        )}

{allowedRules.includes("require_all_rows") && (
  <label>
    <input
      type="checkbox"
      checked={Boolean(
        validationRules.require_all_rows
      )}
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "require_all_rows",
          event.target.checked
        );
      }}
    />{" "}
    Require All Rows
  </label>
)}

        {allowedRules.includes("min_length") && (
          <div>
            <label>
              Minimum Length
            </label>

            <input
              type="number"
              value={
                validationRules.min_length ?? ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateRule(
                  "min_length",
                  event.target.value === ""
                    ? null
                    : Number(event.target.value)
                );
              }}
            />
          </div>
        )}

        {allowedRules.includes("max_length") && (
          <div>
            <label>
              Maximum Length
            </label>

            <input
              type="number"
              value={
                validationRules.max_length ?? ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateRule(
                  "max_length",
                  event.target.value === ""
                    ? null
                    : Number(event.target.value)
                );
              }}
            />
          </div>
        )}

        {allowedRules.includes("minimum") && (
          <div>
            <label>
              Minimum Value
            </label>

            <input
              type="number"
              value={
                validationRules.minimum ?? ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateRule(
                  "minimum",
                  event.target.value === ""
                    ? null
                    : Number(event.target.value)
                );
              }}
            />
          </div>
        )}
{allowedRules.includes("maximum") && (
  <div>
    <label>
      Maximum Value
    </label>

    <input
      type="number"
      value={
        validationRules.maximum ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("decimal_places") && (
  <div>
    <label>
      Decimal Places
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.decimal_places ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "decimal_places",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_selections") && (
  <div>
    <label>
      Minimum Selections
    </label>

    <input
      type="number"
      value={
        validationRules.minimum_selections ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_selections",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_selections") && (
  <div>
    <label>
      Maximum Selections
    </label>

    <input
      type="number"
      value={
        validationRules.maximum_selections ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_selections",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_ranked") && (
  <div>
    <label>
      Minimum Ranked
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.minimum_ranked ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_ranked",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_ranked") && (
  <div>
    <label>
      Maximum Ranked
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.maximum_ranked ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_ranked",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_rows") && (
  <div>
    <label>
      Minimum Rows
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.minimum_rows ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_rows",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_rows") && (
  <div>
    <label>
      Maximum Rows
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.maximum_rows ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_rows",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_repeats") && (
  <div>
    <label>
      Minimum Repeats
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.minimum_repeats ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_repeats",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_repeats") && (
  <div>
    <label>
      Maximum Repeats
    </label>

    <input
      type="number"
      min="0"
      value={
        validationRules.maximum_repeats ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_repeats",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_date") && (
  <div>
    <label>
      Minimum Date
    </label>

    <input
      type="date"
      value={
        validationRules.minimum_date ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_date",
          event.target.value || null
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_date") && (
  <div>
    <label>
      Maximum Date
    </label>

    <input
      type="date"
      value={
        validationRules.maximum_date ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_date",
          event.target.value || null
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_time") && (
  <div>
    <label>
      Minimum Time
    </label>

    <input
      type="time"
      value={
        validationRules.minimum_time ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_time",
          event.target.value || null
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_time") && (
  <div>
    <label>
      Maximum Time
    </label>

    <input
      type="time"
      value={
        validationRules.maximum_time ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_time",
          event.target.value || null
        );
      }}
    />
  </div>
)}

{allowedRules.includes("minimum_datetime") && (
  <div>
    <label>
      Minimum Date and Time
    </label>

    <input
      type="datetime-local"
      value={
        validationRules.minimum_datetime ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "minimum_datetime",
          event.target.value || null
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_datetime") && (
  <div>
    <label>
      Maximum Date and Time
    </label>

    <input
      type="datetime-local"
      value={
        validationRules.maximum_datetime ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_datetime",
          event.target.value || null
        );
      }}
    />
  </div>
)}

{allowedRules.includes("accuracy_threshold") && (
  <div>
    <label>
      Accuracy Threshold (meters)
    </label>

    <input
      type="number"
      min="0"
      step="0.1"
      value={
        validationRules.accuracy_threshold ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "accuracy_threshold",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

{allowedRules.includes("maximum_file_size") && (
  <div>
    <label>
      Maximum File Size (MB)
    </label>

    <input
      type="number"
      min="0"
      step="0.1"
      value={
        validationRules.maximum_file_size ?? ""
      }
      disabled={readOnly}
      onChange={(event) => {
        updateRule(
          "maximum_file_size",
          event.target.value === ""
            ? null
            : Number(event.target.value)
        );
      }}
    />
  </div>
)}

        {allowedRules.includes("pattern") && (
          <div>
            <label>
              Pattern
            </label>

            <input
              type="text"
              value={
                validationRules.pattern ?? ""
              }
              disabled={readOnly}
              onChange={(event) => {
                updateRule(
                  "pattern",
                  event.target.value
                );
              }}
            />
          </div>
        )}

        {allowedRules.length === 0 && (
          <p>
            No validation rules are defined for this
            Question Type.
          </p>
        )}
      </div>
    </div>
  );
}