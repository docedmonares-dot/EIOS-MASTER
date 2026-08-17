export default function QuestionBuilder({
  question,
  onChange,
  readOnly = false,
}) {
  function updateField(fieldName, value) {
    onChange((currentQuestion) => ({
      ...currentQuestion,
      [fieldName]: value,
    }));
  }

  return (
    <div className="enterprise-question-editor__section-panel">
      <div className="enterprise-question-editor__section-heading">
        <div>
          <span className="enterprise-question-editor__eyebrow">
            Question Configuration
          </span>

          <h2>Question</h2>

          <p>
            Define the respondent-facing wording,
            guidance, placeholder, and default response.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        <div>
          <label
            htmlFor="question-builder-question-text"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            Question Text
          </label>

          <textarea
            id="question-builder-question-text"
            value={question?.question_text || ""}
            disabled={readOnly}
            rows={4}
            onChange={(event) => {
              updateField(
                "question_text",
                event.target.value
              );
            }}
            style={{
              width: "100%",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="question-builder-help-text"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            Help / Instruction Text
          </label>

          <textarea
            id="question-builder-help-text"
            value={question?.help_text || ""}
            disabled={readOnly}
            rows={3}
            onChange={(event) => {
              updateField(
                "help_text",
                event.target.value
              );
            }}
            style={{
              width: "100%",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="question-builder-placeholder"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            Placeholder Text
          </label>

          <input
            id="question-builder-placeholder"
            type="text"
            value={
              question?.placeholder_text || ""
            }
            disabled={readOnly}
            onChange={(event) => {
              updateField(
                "placeholder_text",
                event.target.value
              );
            }}
            style={{
              width: "100%",
            }}
          />
        </div>

        <div>
          <label
            htmlFor="question-builder-default-value"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            Default Value
          </label>

          <input
            id="question-builder-default-value"
            type="text"
            value={
              question?.default_value_json?.value ??
              ""
            }
            disabled={readOnly}
            onChange={(event) => {
              updateField(
                "default_value_json",
                {
                  value: event.target.value,
                }
              );
            }}
            style={{
              width: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}