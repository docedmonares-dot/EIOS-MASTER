import assert from "node:assert/strict";

import {
  GEOGRAPHIC_SELECTOR_TYPE_CODE,
  isAnswerEmpty,
  isGeographicSelectorQuestion,
  resolveQuestionTypeCode,
} from "../src/modules/survey-engine/runtime/questionTypeRegistry.js";

assert.equal(GEOGRAPHIC_SELECTOR_TYPE_CODE, "GEOGRAPHIC_SELECTOR");

assert.equal(
  isGeographicSelectorQuestion({
    question_code: "RESPONDENT_LOCATION",
    question_type: { type_code: "GEOGRAPHIC_SELECTOR" },
  }),
  true
);

assert.equal(
  isGeographicSelectorQuestion({
    question_code: "Q001",
    question_type: { type_code: "SHORT_TEXT" },
  }),
  false
);

assert.equal(
  isGeographicSelectorQuestion({
    question_code: "Q002",
    type_code: "GEOGRAPHIC_SELECTOR",
  }),
  true
);

assert.equal(
  resolveQuestionTypeCode({
    question_type_code: " geographic_selector ",
  }),
  "GEOGRAPHIC_SELECTOR"
);

assert.equal(isAnswerEmpty({ path: [] }), true);
assert.equal(
  isAnswerEmpty({
    schema: "eios.geographic-selection.v1",
    path: [{ geo_unit_id: "barangay-any-id" }],
  }),
  false
);

console.log("Geographic selector runtime registry tests passed.");
