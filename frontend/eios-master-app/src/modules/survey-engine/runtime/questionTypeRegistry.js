export const GEOGRAPHIC_SELECTOR_TYPE_CODE =
  "GEOGRAPHIC_SELECTOR";

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
