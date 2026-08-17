export default function SectionModal({
  open = false,
  form,
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
            <span>Questionnaire Structure</span>
            <h2>Add Section</h2>

            <p>
              Create a new section in the survey
              instrument.
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
              <span>Section Title *</span>

              <input
                type="text"
                name="section_title"
                value={form.section_title}
                onChange={onChange}
                disabled={saving}
                required
              />
            </label>

            <label className="survey-project-form__field">
              <span>Section Code</span>

              <input
                type="text"
                name="section_code"
                value={form.section_code}
                onChange={onChange}
                disabled={saving}
                placeholder="Example: DEMOGRAPHICS"
              />
            </label>

            <label className="survey-project-form__field">
              <span>Section Type</span>

              <select
                name="section_type"
                value={form.section_type}
                onChange={onChange}
                disabled={saving}
              >
                <option value="Cover">
                  Cover
                </option>

                <option value="Standard">
                  Standard
                </option>

                <option value="Roster">
                  Roster
                </option>

                <option value="Repeat Group">
                  Repeat Group
                </option>

                <option value="Review">
                  Review
                </option>

                <option value="Closing">
                  Closing
                </option>
              </select>
            </label>

            <label className="survey-project-form__field survey-project-form__field--wide">
              <span>Description</span>

              <textarea
                name="section_description"
                value={form.section_description}
                onChange={onChange}
                disabled={saving}
                rows="3"
              />
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
                ? "Creating Section..."
                : "Create Section"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}