export default function LogicBuilder({
  question,
  onChange,
  readOnly = false,
  logicRecords = [],
  selectedLogic = null,
  logicLoading = false,
  logicError = "",
  onSelectLogic,
  selectedChoiceList = null,
  choiceItems = [],
  choiceLibraryLoading = false,
  choiceLibraryError = "",
  onCreateLogic,
  onUpdateLogic,
  onDeleteLogic,
  questions = [],
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
            Conditional Behavior
          </span>

          <h2>Logic</h2>

          <p>
            Enable conditional behavior for this
            Enterprise Question. Detailed branching,
            skipping, and visibility rules will be
            engineered in the succeeding logic layer.
          </p>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gap: "18px",
        }}
      >
        <label>
          <input
            type="checkbox"
            checked={Boolean(
              question?.logic_enabled
            )}
            disabled={readOnly}
            onChange={(event) => {
              updateField(
                "logic_enabled",
                event.target.checked
              );
            }}
          />{" "}
          Enable Question Logic
        </label>

        {question?.logic_enabled && (
          <div>
            Logic is enabled for this question.
            Conditional rules will be configured
            through the Enterprise Logic Engine.
          </div>
        )}

        {logicLoading && (
          <div>
            Loading Question Logic...
          </div>
        )}

        {logicError && (
          <div>
            {logicError}
          </div>
        )}

        {choiceLibraryLoading && (
          <div>
            Loading Choice Library...
          </div>
        )}

        {choiceLibraryError && (
          <div>
            {choiceLibraryError}
          </div>
        )}

        {!choiceLibraryLoading &&
          !choiceLibraryError &&
          selectedChoiceList && (
            <div>
              <strong>
                Choice List Loaded
              </strong>

              <div>
                {selectedChoiceList.choice_list_name ||
                  selectedChoiceList.choice_list_code ||
                  "Unnamed Choice List"}
              </div>

              <div>
                Items: {choiceItems.length}
              </div>
            </div>
          )}

 <div>
  <button
    type="button"
    disabled={
      readOnly ||
      !question?.question_id
    }
    onClick={() => {
      onCreateLogic?.({
        question_id:
          question.question_id,

        logic_name:
          `Logic Rule ${logicRecords.length + 1}`,

        condition_json: {
          source_question_id:
            question.question_id,

          source_question_code:
            question.question_code || null,

          source_question_text:
            question.question_text || null,

          operator: "EQUALS",

          value: "",

          choice_item_id: null,

          choice_code: null,

          display_label: null,
        },

        action_json: {
          type: "",

          source_question_id:
            question.question_id,

          source_question_code:
            question.question_code || null,

          source_question_text:
            question.question_text || null,

          target_questions: [],

          target_question_id: null,

          target_question_code: null,

          target_question_text: null,
        },

        affected_questions_json: [],

        logic_status: "Draft",
      });
    }}
  >
    New Logic Rule
  </button>
</div>         

        {!logicLoading &&
          !logicError &&
          logicRecords.length > 0 && (
            <div>
              <strong>
                Existing Logic Records
              </strong>

              <div
                style={{
                  display: "grid",
                  gap: "8px",
                  marginTop: "10px",
                }}
              >
                {logicRecords.map(
                  (logicRecord) => (
                    <button
                      key={
                        logicRecord.logic_id
                      }
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        onSelectLogic?.(
                          logicRecord.logic_id
                        );
                      }}
                      style={{
                        textAlign: "left",
                        padding: "10px 12px",
                        cursor: readOnly
                          ? "not-allowed"
                          : "pointer",
                      }}
                    >
                      <strong>
                        {logicRecord.logic_name ||
                          "Unnamed Logic"}
                      </strong>

                      <div>
                        Status:{" "}
                        {
                          logicRecord.logic_status
                        }
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          )}

        {selectedLogic && (
          <div
            style={{
              display: "grid",
              gap: "14px",
              marginTop: "16px",
              padding: "16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
            }}
          >
            <strong>
              Edit Logic Rule
            </strong>

<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
  }}
>
  <button
    type="button"
    disabled={readOnly}
    onClick={() => {
      const confirmed =
        window.confirm(
          `Delete logic rule "${selectedLogic.logic_name || "Unnamed Logic"}"?`
        );

      if (!confirmed) {
        return;
      }

      onDeleteLogic?.(
        selectedLogic.logic_id
      );
    }}
  >
    Delete Logic Rule
  </button>
</div>

<div
  style={{
    display: "grid",
    gap: "6px",
  }}
>
  <label htmlFor="logic-name">
    Logic Name
  </label>

  <input
    id="logic-name"
    type="text"
    disabled={readOnly}
    value={
      selectedLogic.logic_name ||
      ""
    }
    onChange={(event) => {
      onUpdateLogic?.(
        selectedLogic.logic_id,
        {
          logic_name:
            event.target.value,
        }
      );
    }}
  />
</div>

<div
  style={{
    display: "grid",
    gap: "6px",
  }}
>
  <label htmlFor="logic-status">
    Logic Status
  </label>

  <select
    id="logic-status"
    disabled={readOnly}
    value={
      selectedLogic.logic_status ||
      "Draft"
    }
    onChange={(event) => {
      onUpdateLogic?.(
        selectedLogic.logic_id,
        {
          logic_status:
            event.target.value,
        }
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
</div>

            <div
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <label htmlFor="logic-condition-operator">
                Condition Operator
              </label>

              <select
                id="logic-condition-operator"
                disabled={readOnly}
                value={
                  selectedLogic
                    ?.condition_json
                    ?.operator ||
                  "EQUALS"
                }
                onChange={(event) => {
                  onUpdateLogic?.(
                    selectedLogic.logic_id,
                    {
                      condition_json: {
                        ...selectedLogic.condition_json,

                        source_question_id:
                          question?.question_id ||
                          null,

                        source_question_code:
                          question?.question_code ||
                          null,

                        source_question_text:
                          question?.question_text ||
                          null,

                        operator:
                          event.target.value,
                      },
                    }
                  );
                }}
              >
                <option value="EQUALS">
                  Equals
                </option>

                <option value="NOT_EQUALS">
                  Does Not Equal
                </option>

                <option value="IN">
                  Is One Of
                </option>

                <option value="NOT_IN">
                  Is Not One Of
                </option>
              </select>
            </div>

            <div
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <label htmlFor="logic-condition-value">
                Condition Value
              </label>

              <select
                id="logic-condition-value"
                disabled={readOnly}
                value={
                  selectedLogic
                    ?.condition_json
                    ?.value || ""
                }
                onChange={(event) => {
                  const selectedItem =
                    choiceItems.find(
                      (choiceItem) =>
                        choiceItem.choice_value ===
                        event.target.value
                    );

                  onUpdateLogic?.(
                    selectedLogic.logic_id,
                    {
                      condition_json: {
                        source_question_id:
                          question?.question_id ||
                          null,

                        source_question_code:
                          question?.question_code ||
                          null,

                        source_question_text:
                          question?.question_text ||
                          null,

                        operator:
                          selectedLogic
                            ?.condition_json
                            ?.operator ||
                          "EQUALS",

                        value:
                          event.target.value,

                        choice_item_id:
                          selectedItem
                            ?.choice_item_id ||
                          null,

                        choice_code:
                          selectedItem
                            ?.choice_code ||
                          null,

                        display_label:
                          selectedItem
                            ?.display_label ||
                          null,
                      },
                    }
                  );
                }}
              >
                <option value="">
                  Select condition value
                </option>

                {choiceItems.map(
                  (choiceItem) => (
                    <option
                      key={
                        choiceItem.choice_item_id
                      }
                      value={
                        choiceItem.choice_value
                      }
                    >
                      {
                        choiceItem.display_label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              Available condition values:{" "}
              {choiceItems.length}
            </div>

            <div
              style={{
                display: "grid",
                gap: "6px",
              }}
            >
              <label htmlFor="logic-action-type">
                Action Type
              </label>

              <select
                id="logic-action-type"
                disabled={readOnly}
                value={
                  selectedLogic
                    ?.action_json
                    ?.type || ""
                }
                onChange={(event) => {
                  const nextActionType =
                    event.target.value;

                  const existingTargets =
                    Array.isArray(
                      selectedLogic
                        ?.action_json
                        ?.target_questions
                    )
                      ? selectedLogic
                          .action_json
                          .target_questions
                      : [];

                  const legacyTarget =
                    selectedLogic
                      ?.action_json
                      ?.target_question_id
                      ? {
                          question_id:
                            selectedLogic
                              .action_json
                              .target_question_id,

                          question_code:
                            selectedLogic
                              .action_json
                              .target_question_code ||
                            null,

                          question_text:
                            selectedLogic
                              .action_json
                              .target_question_text ||
                            null,
                        }
                      : null;

                  const firstTarget =
                    existingTargets[0] ||
                    legacyTarget ||
                    null;

                  const normalizedTargets =
                    nextActionType === "SKIP"
                      ? firstTarget
                        ? [firstTarget]
                        : []
                      : existingTargets.length > 0
                        ? existingTargets
                        : legacyTarget
                          ? [legacyTarget]
                          : [];

                  const normalizedAffectedIds =
                    normalizedTargets
                      .map(
                        (target) =>
                          target.question_id
                      )
                      .filter(Boolean);

                  onUpdateLogic?.(
                    selectedLogic.logic_id,
                    {
                      action_json: {
                        ...selectedLogic.action_json,

                        type:
                          nextActionType,

                        source_question_id:
                          question?.question_id ||
                          null,

                        source_question_code:
                          question?.question_code ||
                          null,

                        source_question_text:
                          question?.question_text ||
                          null,

                        target_questions:
                          normalizedTargets,

                        target_question_id:
                          normalizedTargets[0]
                            ?.question_id ||
                          null,

                        target_question_code:
                          normalizedTargets[0]
                            ?.question_code ||
                          null,

                        target_question_text:
                          normalizedTargets[0]
                            ?.question_text ||
                          null,
                      },

                      affected_questions_json:
                        normalizedAffectedIds,
                    }
                  );
                }}
              >
                <option value="">
                  Select action
                </option>

                <option value="SHOW">
                  Show Question
                </option>

                <option value="HIDE">
                  Hide Question
                </option>

                <option value="SKIP">
                  Skip Question
                </option>

                <option value="REQUIRE">
                  Require Question
                </option>
              </select>
            </div>

            {selectedLogic
              ?.action_json
              ?.type === "SKIP" ? (
              <div
                style={{
                  display: "grid",
                  gap: "6px",
                }}
              >
                <label htmlFor="logic-skip-target">
                  Skip To Question
                </label>

                <select
                  id="logic-skip-target"
                  disabled={readOnly}
                  value={
                    selectedLogic
                      ?.action_json
                      ?.target_question_id ||
                    ""
                  }
                  onChange={(event) => {
                    const targetQuestion =
                      questions.find(
                        (questionItem) =>
                          questionItem.question_id ===
                          event.target.value
                      );

                    const targetQuestions =
                      targetQuestion
                        ? [
                            {
                              question_id:
                                targetQuestion.question_id,

                              question_code:
                                targetQuestion.question_code,

                              question_text:
                                targetQuestion.question_text,
                            },
                          ]
                        : [];

                    onUpdateLogic?.(
                      selectedLogic.logic_id,
                      {
                        action_json: {
                          ...selectedLogic.action_json,

                          source_question_id:
                            question?.question_id ||
                            null,

                          source_question_code:
                            question?.question_code ||
                            null,

                          source_question_text:
                            question?.question_text ||
                            null,

                          target_question_id:
                            targetQuestion
                              ?.question_id ||
                            null,

                          target_question_code:
                            targetQuestion
                              ?.question_code ||
                            null,

                          target_question_text:
                            targetQuestion
                              ?.question_text ||
                            null,

                          target_questions:
                            targetQuestions,
                        },

                        affected_questions_json:
                          targetQuestion
                            ? [
                                targetQuestion.question_id,
                              ]
                            : [],
                      }
                    );
                  }}
                >
                  <option value="">
                    Select skip destination
                  </option>

                  {questions
                    .filter(
                      (questionItem) =>
                        questionItem.question_id !==
                        question?.question_id
                    )
                    .map((questionItem) => (
                      <option
                        key={
                          questionItem.question_id
                        }
                        value={
                          questionItem.question_id
                        }
                      >
                        {
                          questionItem.question_code
                        }
                        {" — "}
                        {
                          questionItem.question_text
                        }
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "8px",
                }}
              >
                <div>
                  <strong>
                    Target Questions
                  </strong>
                </div>

                {questions
                  .filter(
                    (questionItem) =>
                      questionItem.question_id !==
                      question?.question_id
                  )
                  .map((questionItem) => {
                    const affectedQuestions =
                      Array.isArray(
                        selectedLogic
                          ?.affected_questions_json
                      )
                        ? selectedLogic
                            .affected_questions_json
                        : [];

                    const isSelected =
                      affectedQuestions.includes(
                        questionItem.question_id
                      );

                    return (
                      <label
                        key={
                          questionItem.question_id
                        }
                        style={{
                          display: "flex",
                          alignItems:
                            "flex-start",
                          gap: "8px",
                        }}
                      >
                        <input
                          type="checkbox"
                          disabled={readOnly}
                          checked={isSelected}
                          onChange={() => {
                            const nextIds =
                              isSelected
                                ? affectedQuestions.filter(
                                    (
                                      questionId
                                    ) =>
                                      questionId !==
                                      questionItem.question_id
                                  )
                                : [
                                    ...affectedQuestions,
                                    questionItem.question_id,
                                  ];

                            const targetQuestions =
                              questions.filter(
                                (
                                  candidateQuestion
                                ) =>
                                  nextIds.includes(
                                    candidateQuestion.question_id
                                  )
                              );

                            const normalizedAffectedIds =
                              targetQuestions.map(
                                (
                                  targetQuestion
                                ) =>
                                  targetQuestion.question_id
                              );

                            onUpdateLogic?.(
                              selectedLogic.logic_id,
                              {
                                action_json: {
                                  ...selectedLogic.action_json,

                                  source_question_id:
                                    question?.question_id ||
                                    null,

                                  source_question_code:
                                    question?.question_code ||
                                    null,

                                  source_question_text:
                                    question?.question_text ||
                                    null,

                                  target_questions:
                                    targetQuestions.map(
                                      (
                                        targetQuestion
                                      ) => ({
                                        question_id:
                                          targetQuestion.question_id,

                                        question_code:
                                          targetQuestion.question_code,

                                        question_text:
                                          targetQuestion.question_text,
                                      })
                                    ),

                                  target_question_id:
                                    targetQuestions[0]
                                      ?.question_id ||
                                    null,

                                  target_question_code:
                                    targetQuestions[0]
                                      ?.question_code ||
                                    null,

                                  target_question_text:
                                    targetQuestions[0]
                                      ?.question_text ||
                                    null,
                                },

                                affected_questions_json:
                                  normalizedAffectedIds,
                              }
                            );
                          }}
                        />

                        <span>
                          {
                            questionItem.question_code
                          }
                          {" — "}
                          {
                            questionItem.question_text
                          }
                        </span>
                      </label>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}