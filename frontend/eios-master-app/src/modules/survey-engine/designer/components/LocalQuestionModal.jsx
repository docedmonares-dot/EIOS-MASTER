export default function LocalQuestionModal({
  open = false,
  form,
  questionTypes = [],
  saving = false,
  onChange,
  onSubmit,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="survey-project-modal">
      <div
        className="survey-project-modal__backdrop"
        onClick={onClose}
      />

      <section className="survey-project-modal__dialog questionnaire-small-dialog">
        <div className="survey-project-modal__header">
          <div>
            <span>Survey-Local Question</span>
            <h2>Add Question</h2>

            <p>
              Create a question that belongs only to
              this survey instrument.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form
          className="survey-project-form"
          onSubmit={onSubmit}
        >
          <div className="survey-project-form__grid">
            <label className="survey-project-form__field survey-project-form__field--wide">
              <span>Question Type *</span>

              <select
                name="question_type_id"
                value={form.question_type_id}
                onChange={onChange}
                disabled={saving}
                required
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
            </label>

            <label className="survey-project-form__field survey-project-form__field--wide">
              <span>Question Text *</span>

              <textarea
                name="question_text"
                value={form.question_text}
                onChange={onChange}
                disabled={saving}
                rows="3"
                required
              />
            </label>

            <label className="survey-project-form__field">
              <span>Variable Name</span>

              <input
                type="text"
                name="variable_name"
                value={form.variable_name}
                onChange={onChange}
                disabled={saving}
                placeholder="Automatically generated"
              />
            </label>

            <label className="survey-project-form__field">
              <span>Placeholder</span>

              <input
                type="text"
                name="placeholder_text"
                value={form.placeholder_text}
                onChange={onChange}
                disabled={saving}
              />
            </label>

            <label className="survey-project-form__field survey-project-form__field--wide">
              <span>Help Text</span>

              <textarea
                name="help_text"
                value={form.help_text}
                onChange={onChange}
                disabled={saving}
                rows="2"
              />
            </label>

            <label className="questionnaire-checkbox-field survey-project-form__field--wide">
              <input
                type="checkbox"
                name="required_flag"
                checked={form.required_flag}
                onChange={onChange}
                disabled={saving}
              />

              <span>
                Require an answer to this question
              </span>
            </label>
          </div>

          <div className="survey-project-form__actions">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="survey-project-form__cancel"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="survey-project-form__submit"
            >
              {saving
                ? "Creating Question..."
                : "Create Question"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}