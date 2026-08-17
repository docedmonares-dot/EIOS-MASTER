export default function CalculationBuilder({
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
            Calculation Engine
          </span>

          <h2>Calculation</h2>

          <p>
            Define the formula or expression used to compute
            the value of this Enterprise Question.
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
            htmlFor="calculation-expression"
            style={{
              display: "block",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            Calculation Expression
          </label>

          <textarea
            id="calculation-expression"
            rows={5}
            value={
              question?.calculation_expression || ""
            }
            disabled={readOnly}
            onChange={(event) => {
              updateField(
                "calculation_expression",
                event.target.value
              );
            }}
            placeholder="Example: income - expenses"
            style={{
              width: "100%",
            }}
          />
        </div>
      </div>
    </div>
  );
}