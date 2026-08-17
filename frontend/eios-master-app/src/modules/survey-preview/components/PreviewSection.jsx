import {
  PreviewQuestion,
} from "./index";

export default function PreviewSection({
  section = null,
  responses = {},
  onResponseChange,
  sectionNumber = 1,
}) {
  if (!section) {
    return null;
  }

  const questions =
    section.questions || [];

  return (
    <section className="preview-section">
      <header className="preview-section__header">
        <span>
          Section {sectionNumber}
        </span>

        <h2>
          {section.section_title ||
            "Untitled Section"}
        </h2>

        {section.section_description && (
          <p>
            {section.section_description}
          </p>
        )}
      </header>

      {questions.length === 0 ? (
        <div className="preview-section__empty">
          This section has no questions.
        </div>
      ) : (
        <div className="preview-section__questions">
          {questions.map(
            (question, index) => (
              <PreviewQuestion
                key={
                  question
                    .questionnaire_item_id
                }
                question={question}
                questionNumber={
                  index + 1
                }
                value={
                  responses[
                    question.variable_name
                  ]
                }
                onChange={(value) =>
                  onResponseChange?.(
                    question.variable_name,
                    value
                  )
                }
              />
            )
          )}
        </div>
      )}
    </section>
  );
}