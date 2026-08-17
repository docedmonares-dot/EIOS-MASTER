export default function AppearanceBuilder({
  question,
  onChange,
  readOnly = false,
}) {
  const appearance =
    question?.appearance_json &&
    typeof question.appearance_json === "object" &&
    !Array.isArray(question.appearance_json)
      ? question.appearance_json
      : {};

  function updateAppearance(fieldName, value) {
    onChange((currentQuestion) => ({
      ...currentQuestion,
      appearance_json: {
        ...(currentQuestion.appearance_json &&
        typeof currentQuestion.appearance_json === "object" &&
        !Array.isArray(
          currentQuestion.appearance_json
        )
          ? currentQuestion.appearance_json
          : {}),
        [fieldName]: value,
      },
    }));
  }

  return (
    <div className="enterprise-question-editor__section-panel">
      <div className="enterprise-question-editor__section-heading">
        <div>
          <span className="enterprise-question-editor__eyebrow">
            Presentation Configuration
          </span>

          <h2>Appearance</h2>

          <p>
            Configure how the question is presented
            across supported survey and field devices.
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
          <label>
            Display Width
          </label>

          <select
            value={
              appearance.display_width || "full"
            }
            disabled={readOnly}
            onChange={(event) => {
              updateAppearance(
                "display_width",
                event.target.value
              );
            }}
          >
            <option value="full">
              Full Width
            </option>

            <option value="half">
              Half Width
            </option>

            <option value="third">
              One Third
            </option>
          </select>
        </div>

        <label>
          <input
            type="checkbox"
            checked={Boolean(
              appearance.compact_mode
            )}
            disabled={readOnly}
            onChange={(event) => {
              updateAppearance(
                "compact_mode",
                event.target.checked
              );
            }}
          />{" "}
          Compact Display
        </label>

        <label>
          <input
            type="checkbox"
            checked={Boolean(
              appearance.hide_question_number
            )}
            disabled={readOnly}
            onChange={(event) => {
              updateAppearance(
                "hide_question_number",
                event.target.checked
              );
            }}
          />{" "}
          Hide Question Number
        </label>

        <label>
          <input
            type="checkbox"
            checked={Boolean(
              appearance.mobile_full_width
            )}
            disabled={readOnly}
            onChange={(event) => {
              updateAppearance(
                "mobile_full_width",
                event.target.checked
              );
            }}
          />{" "}
          Force Full Width on Mobile
        </label>
      </div>
    </div>
  );
}