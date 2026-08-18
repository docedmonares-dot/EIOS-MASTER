export const GEOGRAPHIC_SELECTOR_TYPE_CODE =
  "GEOGRAPHIC_SELECTOR";
export const CANDIDATE_EVALUATION_TYPE_CODE =
  "CANDIDATE_EVALUATION";
export const BALLOT_SELECTOR_TYPE_CODE =
  "BALLOT_SELECTOR";

export function resolveQuestionTypeCode(question) {
  return String(
    question?.question_type?.type_code ??
      question?.type_code ??
      question?.question_type_code ??
      ""
  )
    .trim()
    .toUpperCase();
}

export function isGeographicSelectorQuestion(question) {
  return (
    resolveQuestionTypeCode(question) ===
    GEOGRAPHIC_SELECTOR_TYPE_CODE
  );
}

export function isAnswerEmpty(value) {
  if (value === undefined || value === null || value === "") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    if (Array.isArray(value.path)) {
      return value.path.length === 0;
    }

    return Object.keys(value).length === 0;
  }

  return false;
}

export function isQuestionAnswerValid(
  question,
  value,
  contextResponses = {}
) {
  if (isAnswerEmpty(value)) {
    return false;
  }

  const typeCode =
    resolveQuestionTypeCode(question);

  if (
    typeCode ===
    CANDIDATE_EVALUATION_TYPE_CODE
  ) {
    const candidates =
      question?.choice_list?.choices || [];
    const answers = value?.candidates || {};

    return candidates
      .filter(
        (candidate) =>
          String(
            candidate.option_code || ""
          ).toUpperCase() !== "UNDECIDED"
      )
      .every((candidate) => {
        const candidateId =
          candidate.option_code ||
          candidate.choice_code;
        const answer = answers[candidateId];

        return (
          [1, 2].includes(answer?.awareness) &&
          [1, 2, 3].includes(
            answer?.satisfaction
          ) &&
          [1, 2, 3].includes(answer?.trust)
        );
      });
  }

  if (
    typeCode === BALLOT_SELECTOR_TYPE_CODE
  ) {
    const selected =
      value?.selected_candidate_ids || [];
    const settings =
      (question?.settings || question?.settings_json)
        ?.election_position || {};
    const minimum = Number(
      settings.min_selections ?? 1
    );
    const maximum = Number(
      settings.max_selections ?? 1
    );
    const evaluation =
      contextResponses[settings.evaluation_variable] || {};
    const evaluationCandidates = evaluation.candidates || {};
    const hasDistrustedSelection = selected.some(
      (candidateId) =>
        evaluationCandidates[candidateId]?.trust === 3
    );

    return (
      Array.isArray(selected) &&
      selected.length >= minimum &&
      selected.length <= maximum &&
      !hasDistrustedSelection
    );
  }

  return true;
}
