/**
 * EIOS ENTERPRISE
 * Book III — Survey & Census Engineering
 *
 * Enterprise Question Type Section Registry
 *
 * This registry defines which editor sections are enabled for every
 * supported enterprise question type.
 *
 * The Enterprise Question Editor must read this registry instead of
 * manually deciding which sections to display.
 */

export const ENTERPRISE_EDITOR_SECTIONS = Object.freeze({
  GENERAL: {
    id: "general",
    label: "General",
    description:
      "Manage the question identity, ownership, classification, and lifecycle.",
    order: 10,
  },

  QUESTION: {
    id: "question",
    label: "Question",
    description:
      "Define the question text, instructions, labels, and response configuration.",
    order: 20,
  },

  CHOICES: {
    id: "choices",
    label: "Choices",
    description:
      "Configure response options and connect reusable Enterprise Choice Libraries.",
    order: 30,
  },

  VALIDATION: {
    id: "validation",
    label: "Validation",
    description:
      "Define required responses, limits, patterns, ranges, and quality rules.",
    order: 40,
  },

  LOGIC: {
    id: "logic",
    label: "Logic",
    description:
      "Configure visibility, branching, skipping, enabling, and conditional behavior.",
    order: 50,
  },

  APPEARANCE: {
    id: "appearance",
    label: "Appearance",
    description:
      "Control presentation, layout, device behavior, and enumerator experience.",
    order: 60,
  },

  CAPTURE: {
    id: "capture",
    label: "Capture",
    description:
      "Configure camera, GPS, barcode, signature, file, and device capture behavior.",
    order: 70,
  },

  ROSTER: {
    id: "roster",
    label: "Roster",
    description:
      "Configure repeating records, household members, and nested data structures.",
    order: 80,
  },

  CALCULATION: {
    id: "calculation",
    label: "Calculation",
    description:
      "Define formulas, derived values, dependencies, and computed outputs.",
    order: 90,
  },

  METADATA: {
    id: "metadata",
    label: "Metadata",
    description:
      "Manage enterprise classifications, tags, governance, lineage, and interoperability.",
    order: 100,
  },

  ANALYTICS: {
    id: "analytics",
    label: "Analytics",
    description:
      "Define indicators, dimensions, measures, aggregation, and dashboard behavior.",
    order: 110,
  },

  DATA_MAPPING: {
    id: "data-mapping",
    label: "Data Mapping",
    description:
      "Configure Excel, CSV, SPSS, Power BI, and future statistical-system mappings.",
    order: 120,
  },

  PREVIEW: {
    id: "preview",
    label: "Preview",
    description:
      "Review the question as it will appear across supported devices and workspaces.",
    order: 130,
  },
});

const BASE_SECTIONS = Object.freeze([
  "GENERAL",
  "QUESTION",
  "VALIDATION",
  "APPEARANCE",
  "METADATA",
  "ANALYTICS",
  "DATA_MAPPING",
  "PREVIEW",
]);

const CHOICE_SECTIONS = Object.freeze([
  "GENERAL",
  "QUESTION",
  "CHOICES",
  "VALIDATION",
  "LOGIC",
  "APPEARANCE",
  "METADATA",
  "ANALYTICS",
  "DATA_MAPPING",
  "PREVIEW",
]);

const CAPTURE_SECTIONS = Object.freeze([
  "GENERAL",
  "QUESTION",
  "VALIDATION",
  "LOGIC",
  "APPEARANCE",
  "CAPTURE",
  "METADATA",
  "ANALYTICS",
  "DATA_MAPPING",
  "PREVIEW",
]);

const ROSTER_SECTIONS = Object.freeze([
  "GENERAL",
  "QUESTION",
  "VALIDATION",
  "LOGIC",
  "APPEARANCE",
  "ROSTER",
  "METADATA",
  "ANALYTICS",
  "DATA_MAPPING",
  "PREVIEW",
]);

const CALCULATED_SECTIONS = Object.freeze([
  "GENERAL",
  "QUESTION",
  "VALIDATION",
  "LOGIC",
  "APPEARANCE",
  "CALCULATION",
  "METADATA",
  "ANALYTICS",
  "DATA_MAPPING",
  "PREVIEW",
]);

const HIDDEN_SECTIONS = Object.freeze([
  "GENERAL",
  "QUESTION",
  "LOGIC",
  "CALCULATION",
  "METADATA",
  "ANALYTICS",
  "DATA_MAPPING",
  "PREVIEW",
]);

export const QUESTION_TYPE_SECTION_REGISTRY = Object.freeze({
  SHORT_TEXT: BASE_SECTIONS,
  LONG_TEXT: BASE_SECTIONS,
  INTEGER: BASE_SECTIONS,
  DECIMAL: BASE_SECTIONS,
  CURRENCY: BASE_SECTIONS,
  DATE: BASE_SECTIONS,
  TIME: BASE_SECTIONS,
  DATETIME: BASE_SECTIONS,

  SINGLE_CHOICE: CHOICE_SECTIONS,
  MULTIPLE_CHOICE: CHOICE_SECTIONS,
  YES_NO: CHOICE_SECTIONS,
  DROPDOWN: CHOICE_SECTIONS,
  MATRIX: CHOICE_SECTIONS,
  LIKERT_SCALE: CHOICE_SECTIONS,
RANKING: CHOICE_SECTIONS,

  GPS: CAPTURE_SECTIONS,
  PHOTO: CAPTURE_SECTIONS,
  SIGNATURE: CAPTURE_SECTIONS,
  BARCODE_QR: CAPTURE_SECTIONS,
  FILE_UPLOAD: CAPTURE_SECTIONS,

  REPEAT_GROUP: ROSTER_SECTIONS,
  HOUSEHOLD_ROSTER: ROSTER_SECTIONS,

  CALCULATED_FIELD: CALCULATED_SECTIONS,
  HIDDEN_FIELD: HIDDEN_SECTIONS,
});

export const DEFAULT_QUESTION_TYPE = "SHORT_TEXT";

/**
 * Returns the ordered editor-section metadata for a Question Type.
 *
 * Unknown Question Types safely fall back to the standard sections.
 */
export function getSectionsForQuestionType(questionTypeCode) {
  const normalizedCode =
    typeof questionTypeCode === "string"
      ? questionTypeCode.trim().toUpperCase()
      : DEFAULT_QUESTION_TYPE;

  const sectionKeys =
    QUESTION_TYPE_SECTION_REGISTRY[normalizedCode] ??
    QUESTION_TYPE_SECTION_REGISTRY[DEFAULT_QUESTION_TYPE];

  return sectionKeys
    .map((sectionKey) => ENTERPRISE_EDITOR_SECTIONS[sectionKey])
    .filter(Boolean)
    .sort((firstSection, secondSection) => {
      return firstSection.order - secondSection.order;
    });
}

/**
 * Returns true when a Question Type supports a specific editor section.
 */
export function questionTypeSupportsSection(
  questionTypeCode,
  sectionId
) {
  return getSectionsForQuestionType(questionTypeCode).some(
    (section) => section.id === sectionId
  );
}

/**
 * Returns all currently registered enterprise Question Type codes.
 */
export function getRegisteredQuestionTypeCodes() {
  return Object.keys(QUESTION_TYPE_SECTION_REGISTRY);
}