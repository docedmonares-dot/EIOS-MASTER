import {
  GeographicSelectorQuestion,
} from "./index";
import { isGeographicSelectorQuestion } from "../../survey-engine/runtime/questionTypeRegistry";
import {
  BallotSelectorControl,
  CandidateEvaluationControl,
} from "./ElectionResearchControls";

function renderTextInput({
  question,
  value,
  onChange,
}) {
  const inputType =
    question.question_type
      ?.response_data_type === "number"
      ? "number"
      : "text";

  return (
    <input
      type={inputType}
      value={value ?? ""}
      placeholder={
        question.placeholder_text || ""
      }
      onChange={(event) =>
        onChange(event.target.value)
      }
    />
  );
}

function renderLongText({
  question,
  value,
  onChange,
}) {
  return (
    <textarea
      rows="5"
      value={value ?? ""}
      placeholder={
        question.placeholder_text || ""
      }
      onChange={(event) =>
        onChange(event.target.value)
      }
    />
  );
}

function renderYesNo({
  question,
  value,
  onChange,
}) {
  const options = [
    {
      label: "Yes",
      value: true,
    },
    {
      label: "No",
      value: false,
    },
  ];

  return (
    <div className="preview-question__options">
      {options.map((option) => (
        <label
          key={String(option.value)}
          className="preview-question__option"
        >
          <input
            type="radio"
            name={
              question.questionnaire_item_id
            }
            checked={value === option.value}
            onChange={() =>
              onChange(option.value)
            }
          />

          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function resolveChoiceOptions(question) {
  const choices =
    question.choice_list?.choices ||
    question.choice_list?.options ||
    question.options ||
    [];

  return choices
    .filter(
      (choice) =>
        choice.is_active !== false
    )
    .sort(
      (leftChoice, rightChoice) =>
        Number(
          leftChoice.sort_order || 0
        ) -
        Number(
          rightChoice.sort_order || 0
        )
    );
}

function renderSingleChoice({
  question,
  value,
  onChange,
}) {
  const options =
    resolveChoiceOptions(question);

  if (options.length === 0) {
    return (
      <div className="preview-question__unsupported">
        No answer options are available.
      </div>
    );
  }

  return (
    <div className="preview-question__options">
      {options.map((option) => {
        const optionValue =
          option.option_value ??
          option.value ??
          option.option_code ??
          option.choice_id;

        const optionLabel =
          option.option_label ??
          option.label ??
          String(optionValue);

        return (
          <label
            key={String(optionValue)}
            className="preview-question__option"
          >
            <input
              type="radio"
              name={
                question
                  .questionnaire_item_id
              }
              value={optionValue}
              checked={
                value === optionValue
              }
              onChange={() =>
                onChange(optionValue)
              }
            />

            <span>{optionLabel}</span>
          </label>
        );
      })}
    </div>
  );
}

function renderMultipleChoice({
  question,
  value,
  onChange,
}) {
  const options =
    resolveChoiceOptions(question);

  const selectedValues =
    Array.isArray(value)
      ? value
      : [];

  if (options.length === 0) {
    return (
      <div className="preview-question__unsupported">
        No answer options are available.
      </div>
    );
  }

  function toggleValue(optionValue) {
    if (
      selectedValues.includes(
        optionValue
      )
    ) {
      onChange(
        selectedValues.filter(
          (selectedValue) =>
            selectedValue !==
            optionValue
        )
      );

      return;
    }

    onChange([
      ...selectedValues,
      optionValue,
    ]);
  }

  return (
    <div className="preview-question__options">
      {options.map((option) => {
        const optionValue =
          option.option_value ??
          option.value ??
          option.option_code ??
          option.choice_id;

        const optionLabel =
          option.option_label ??
          option.label ??
          String(optionValue);

        return (
          <label
            key={String(optionValue)}
            className="preview-question__option"
          >
            <input
              type="checkbox"
              checked={
                selectedValues.includes(
                  optionValue
                )
              }
              onChange={() =>
                toggleValue(optionValue)
              }
            />

            <span>{optionLabel}</span>
          </label>
        );
      })}
    </div>
  );
}

function renderDateInput({
  question,
  value,
  onChange,
}) {
  const typeCode =
    question.question_type
      ?.type_code || "";

  let inputType = "date";

  if (
    typeCode
      .toLowerCase()
      .includes("datetime")
  ) {
    inputType = "datetime-local";
  } else if (
    typeCode
      .toLowerCase()
      .includes("time")
  ) {
    inputType = "time";
  }

  return (
    <input
      type={inputType}
      value={value ?? ""}
      onChange={(event) =>
        onChange(event.target.value)
      }
    />
  );
}

function renderQuestionControl({
  question,
  value,
  onChange,
  contextResponses,
}) {
  const typeCode =
    String(
      question.question_type
      ?.type_code || ""
    ).toLowerCase();

  if (typeCode === "candidate_evaluation") {
    return (
      <CandidateEvaluationControl
        question={question}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (typeCode === "ballot_selector") {
    return (
      <BallotSelectorControl
        question={question}
        value={value}
        onChange={onChange}
        contextResponses={contextResponses}
      />
    );
  }

  if (isGeographicSelectorQuestion(question)) {
  return (
    <GeographicSelectorQuestion
      question={question}
      value={value}
      onChange={onChange}
    />
  );
} 

  if (
    typeCode.includes("long") ||
    typeCode.includes("paragraph") ||
    typeCode.includes("textarea")
  ) {
    return renderLongText({
      question,
      value,
      onChange,
    });
  }

  if (
    typeCode.includes("yes") &&
    typeCode.includes("no")
  ) {
    return renderYesNo({
      question,
      value,
      onChange,
    });
  }

  if (
    typeCode.includes("multiple") ||
    typeCode.includes("checkbox")
  ) {
    return renderMultipleChoice({
      question,
      value,
      onChange,
    });
  }

  if (
    typeCode.includes("single") ||
    typeCode.includes("radio") ||
    typeCode.includes("dropdown")
  ) {
    return renderSingleChoice({
      question,
      value,
      onChange,
    });
  }

  if (
    typeCode.includes("date") ||
    typeCode.includes("time")
  ) {
    return renderDateInput({
      question,
      value,
      onChange,
    });
  }

  return renderTextInput({
    question,
    value,
    onChange,
  });
}

export default function PreviewQuestion({
  question,
  value,
  onChange,
  questionNumber,
  contextResponses = {},
}) {
  if (!question) {
    return null;
  }

  return (
    <article className="preview-question">
      <header className="preview-question__header">
        <span className="preview-question__number">
          {questionNumber}
        </span>

        <div>
          <h3>
            {question.question_text}

            {question.required && (
              <sup
                className="preview-question__required"
                aria-label="Required"
              >
                *
              </sup>
            )}
          </h3>

          {question.question_description && (
            <p>
              {
                question
                  .question_description
              }
            </p>
          )}
        </div>
      </header>

      <div className="preview-question__control">
        {renderQuestionControl({
          question,
          value,
          onChange,
          contextResponses,
        })}
      </div>

      {question.help_text && (
        <small className="preview-question__help">
          {question.help_text}
        </small>
      )}
    </article>
  );
}
