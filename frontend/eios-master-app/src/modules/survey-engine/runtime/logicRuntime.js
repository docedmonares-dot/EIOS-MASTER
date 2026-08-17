export function evaluateLogicCondition(
  conditionJson = {},
  answerValue
) {
  const operator = String(
    conditionJson?.operator || ""
  )
    .trim()
    .toUpperCase();

  const expectedValue =
    conditionJson?.value;

  const hasAnswer =
    answerValue !== undefined &&
    answerValue !== null &&
    !(
      typeof answerValue === "string" &&
      answerValue.trim() === ""
    );

  if (!hasAnswer) {
    return false;
  }

  switch (operator) {
    case "EQUALS":
      return answerValue === expectedValue;

    case "NOT_EQUALS":
      return answerValue !== expectedValue;

    case "IN":
      return Array.isArray(expectedValue)
        ? expectedValue.includes(answerValue)
        : answerValue === expectedValue;

    case "NOT_IN":
      return Array.isArray(expectedValue)
        ? !expectedValue.includes(answerValue)
        : answerValue !== expectedValue;

    default:
      return false;
  }
}

export function evaluateQuestionLogicRules(
  logicRules = [],
  answersByQuestionId = {}
) {
  return logicRules
    .filter(
      (logicRule) =>
        logicRule?.logic_status === "Active"
    )
    .map((logicRule) => {
      const condition =
        logicRule?.condition_json || {};

      const sourceQuestionId =
        condition?.source_question_id ||
        logicRule?.question_id ||
        null;

      const answerValue =
        sourceQuestionId
          ? answersByQuestionId[
              sourceQuestionId
            ]
          : undefined;

      const matched =
        evaluateLogicCondition(
          condition,
          answerValue
        );

      return {
        logic_id:
          logicRule?.logic_id || null,

        logic_name:
          logicRule?.logic_name || null,

        matched,

        source_question_id:
          sourceQuestionId,

        answer_value:
          answerValue,

        condition_json:
          condition,

        action_json:
          logicRule?.action_json || {},

        affected_questions_json:
          Array.isArray(
            logicRule
              ?.affected_questions_json
          )
            ? logicRule
                .affected_questions_json
            : [],
      };
    });
}

export function buildLogicExecutionState(
  evaluatedRules = []
) {
  const executionState = {
    show_question_ids: [],
    hide_question_ids: [],
    require_question_ids: [],
    skip_to_question_id: null,
    matched_logic_ids: [],
  };

  evaluatedRules
    .filter(
      (evaluation) =>
        evaluation?.matched === true
    )
    .forEach((evaluation) => {
      const actionType = String(
        evaluation?.action_json?.type || ""
      )
        .trim()
        .toUpperCase();

      const affectedQuestionIds =
        Array.isArray(
          evaluation?.affected_questions_json
        )
          ? evaluation
              .affected_questions_json
          : [];

      if (evaluation?.logic_id) {
        executionState.matched_logic_ids.push(
          evaluation.logic_id
        );
      }

      switch (actionType) {
        case "SHOW":
          executionState.show_question_ids.push(
            ...affectedQuestionIds
          );
          break;

        case "HIDE":
          executionState.hide_question_ids.push(
            ...affectedQuestionIds
          );
          break;

        case "REQUIRE":
          executionState.require_question_ids.push(
            ...affectedQuestionIds
          );
          break;

        case "SKIP":
          executionState.skip_to_question_id =
            evaluation?.action_json
              ?.target_question_id ||
            affectedQuestionIds[0] ||
            null;
          break;

        default:
          break;
      }
    });

  executionState.show_question_ids = [
    ...new Set(
      executionState.show_question_ids
    ),
  ];

  executionState.hide_question_ids = [
    ...new Set(
      executionState.hide_question_ids
    ),
  ];

  executionState.require_question_ids = [
    ...new Set(
      executionState.require_question_ids
    ),
  ];

  executionState.matched_logic_ids = [
    ...new Set(
      executionState.matched_logic_ids
    ),
  ];

  return executionState;
}

export function runQuestionLogicRuntime(
  logicRules = [],
  answersByQuestionId = {}
) {
  const evaluatedRules =
    evaluateQuestionLogicRules(
      logicRules,
      answersByQuestionId
    );

  const executionState =
    buildLogicExecutionState(
      evaluatedRules
    );

  return {
    evaluated_rules:
      evaluatedRules,

    execution_state:
      executionState,
  };
}