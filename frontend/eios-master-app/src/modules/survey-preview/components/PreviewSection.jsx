import { Fragment, useState } from "react";

import {
  PreviewQuestion,
} from "./index";
import { isQuestionAnswerValid } from "../../survey-engine/runtime/questionTypeRegistry";

export default function PreviewSection({
  section = null,
  responses = {},
  onResponseChange,
  sectionNumber = 1,
  contextResponses = {},
  canGoPrevious = false,
  canGoNext = false,
  onPrevious,
  onNext,
}) {
  const [navigationError, setNavigationError] =
    useState("");
  if (!section) {
    return null;
  }

  const questions =
    section.questions || [];

  function handleNext() {
    const incomplete = questions.filter(
      (question) =>
        Boolean(
          question.required ||
            question.required_flag ||
            question.required_override
        ) &&
        !isQuestionAnswerValid(
          question,
          responses[question.variable_name],
          contextResponses
        )
    );

    if (incomplete.length > 0) {
      setNavigationError(
        "Complete every required answer in this section before proceeding."
      );
      return;
    }

    setNavigationError("");
    onNext?.();
  }

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
            (question, index) => {
              const group =
                (question.settings || question.settings_json)
                  ?.election_position || {};
              const previousGroup =
                (questions[index - 1]?.settings ||
                  questions[index - 1]?.settings_json)
                  ?.election_position || {};
              const startsGroup =
                group.electoral_group_code &&
                group.electoral_group_code !==
                  previousGroup.electoral_group_code;

              return (
              <Fragment key={question.questionnaire_item_id}>
              {startsGroup && (
                <header
                  style={{
                    padding: "12px 14px",
                    borderRadius: "10px",
                    background: "#eff6ff",
                    border: "1px solid #bfdbfe",
                  }}
                >
                  <strong>
                    {group.electoral_group_name ||
                      group.electoral_group_code}
                  </strong>
                </header>
              )}
              <PreviewQuestion
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
                contextResponses={
                  contextResponses
                }
              />
              </Fragment>
              );
            }
          )}
        </div>
      )}

      {navigationError && (
        <div
          role="alert"
          className="ballot-selector-locked"
          style={{ marginTop: "18px" }}
        >
          {navigationError}
        </div>
      )}

      <footer
        style={{
          display: "grid",
          gridTemplateColumns:
            canGoPrevious ? "1fr 1fr" : "1fr",
          gap: "12px",
          marginTop: "22px",
        }}
      >
        {canGoPrevious && (
          <button
            type="button"
            onClick={() => {
              setNavigationError("");
              onPrevious?.();
            }}
          >
            Previous Section
          </button>
        )}

        {canGoNext ? (
          <button
            type="button"
            onClick={handleNext}
            style={{
              minHeight: "52px",
              border: 0,
              borderRadius: "12px",
              background: "#2563eb",
              color: "#fff",
              fontWeight: 700,
            }}
          >
            Next Section
          </button>
        ) : (
          <button type="button" disabled>
            End of Preview
          </button>
        )}
      </footer>
    </section>
  );
}
