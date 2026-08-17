import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronRight,
  CircleCheck,
  Database,
  Eye,
  FileCheck2,
  RefreshCw,
  Save,
  Send,
  Settings2,
} from "lucide-react";

import MainLayout from "../../../layouts/MainLayout";

import GeneralBuilder from "../components/GeneralBuilder";
import QuestionBuilder from "../components/QuestionBuilder";
import ValidationBuilder from "../components/ValidationBuilder";
import CalculationBuilder from "../components/CalculationBuilder";
import useEnterpriseQuestionBank from "../hooks/useEnterpriseQuestionBank";
import AppearanceBuilder from "../components/AppearanceBuilder";
import LogicBuilder from "../components/LogicBuilder";
import useEnterpriseQuestionMetadata from "../hooks/useEnterpriseQuestionMetadata";
import useEnterpriseQuestionLogic from "../hooks/useEnterpriseQuestionLogic";
import useEnterpriseChoiceLibrary from "../hooks/useEnterpriseChoiceLibrary";

import {
  DEFAULT_QUESTION_TYPE,
  getRegisteredQuestionTypeCodes,
  getSectionsForQuestionType,
} from "../utils/questionTypeSectionRegistry";

const QUESTION_TYPE_LABELS = Object.freeze({
  SHORT_TEXT: "Short Text",
  LONG_TEXT: "Long Text",
  INTEGER: "Integer",
  DECIMAL: "Decimal",
  SINGLE_CHOICE: "Single Choice",
  MULTIPLE_CHOICE: "Multiple Choice",
  YES_NO: "Yes / No",
  DROPDOWN: "Dropdown",
  DATE: "Date",
  TIME: "Time",
  DATETIME: "Date and Time",
  GPS: "GPS",
  PHOTO: "Photo",
  SIGNATURE: "Signature",
  BARCODE_QR: "Barcode / QR",
  FILE_UPLOAD: "File Upload",
  MATRIX: "Matrix",
  REPEAT_GROUP: "Repeat Group",
  HOUSEHOLD_ROSTER: "Household Roster",
  CALCULATED_FIELD: "Calculated Field",
  HIDDEN_FIELD: "Hidden Field",
});

const QUESTION_TYPE_GROUPS = Object.freeze([
  {
    label: "Text and Numeric",
    questionTypes: [
      "SHORT_TEXT",
      "LONG_TEXT",
      "INTEGER",
      "DECIMAL",
      "CURRENCY",
    ],
  },
  {
    label: "Choice and Selection",
    questionTypes: [
      "SINGLE_CHOICE",
      "MULTIPLE_CHOICE",
      "YES_NO",
      "DROPDOWN",
      "MATRIX",
      "LIKERT_SCALE",
  "RANKING",
    ],
  },
  {
    label: "Date and Time",
    questionTypes: [
      "DATE",
      "TIME",
      "DATETIME",
    ],
  },
  {
    label: "Device and Media Capture",
    questionTypes: [
      "GPS",
      "PHOTO",
      "SIGNATURE",
      "BARCODE_QR",
      "FILE_UPLOAD",
    ],
  },
  {
    label: "Structured and Advanced",
    questionTypes: [
      "REPEAT_GROUP",
      "HOUSEHOLD_ROSTER",
      "CALCULATED_FIELD",
      "HIDDEN_FIELD",
    ],
  },
]);

function createEmptyWorkingQuestion() {
  return {
    question_code: "",
    variable_name: "",
    question_text: "",
    question_description: "",
    question_type_id: null,
    question_type: DEFAULT_QUESTION_TYPE,
    question_category_id: null,
    question_module: "",
    question_group: "",
    question_status: "Draft",
    version_number: 1,
    required_flag: false,
    is_sensitive: false,
    is_personally_identifiable: false,
  };
}

function formatQuestionTypeLabel(questionTypeCode) {
  if (!questionTypeCode) {
    return "Not Selected";
  }

  return (
    QUESTION_TYPE_LABELS[questionTypeCode] ??
    questionTypeCode
      .toLowerCase()
      .split("_")
      .map((word) => {
        return (
          word.charAt(0).toUpperCase() +
          word.slice(1)
        );
      })
      .join(" ")
  );
}

function EditorSectionPlaceholder({
  section,
  questionTypeCode,
}) {
  return (
    <div className="enterprise-question-editor__section-panel">
      <div className="enterprise-question-editor__section-heading">
        <div>
          <span className="enterprise-question-editor__eyebrow">
            Active Editor Section
          </span>

          <h2>{section.label}</h2>

          <p>{section.description}</p>
        </div>

        <span className="enterprise-question-editor__section-status">
          <CircleCheck size={16} />
          Enabled
        </span>
      </div>

      <div className="enterprise-question-editor__placeholder">
        <Settings2 size={30} />

        <h3>{section.label} Builder</h3>

        <p>
          This builder is enabled for the selected{" "}
          <strong>
            {formatQuestionTypeLabel(questionTypeCode)}
          </strong>{" "}
          Question Type.
        </p>

        <p>
          Its production controls, metadata schema,
          validation, persistence, and service integration
          will be added through the succeeding Book III
          development layers.
        </p>
      </div>
    </div>
  );
}

export default function EnterpriseQuestionEditorPage() {
  const registeredQuestionTypes = useMemo(
    () => getRegisteredQuestionTypeCodes(),
    []
  );

const {
  questions,
  selectedQuestion,
  loading,
  saving,
  deleting,
  error,
  lastLoadedAt,
  refresh,
  createQuestion,
  updateQuestion,
  removeQuestion,
  selectQuestion,
  clearSelection,
} = useEnterpriseQuestionBank();

  const {
    questionTypes,
    categories,
    loading: metadataLoading,
    error: metadataError,
  } = useEnterpriseQuestionMetadata();

const {
  logicRecords,
  selectedLogic,
  loading: logicLoading,
  error: logicError,
  loadLogicByQuestionId,
  loadLogicById,
  createLogic,
  updateLogic,
  removeLogic,
} = useEnterpriseQuestionLogic();

const {
  selectedChoiceList,
  choiceItems,
  loading: choiceLibraryLoading,
  error: choiceLibraryError,
  loadChoiceListById,
  clearChoiceList,
} = useEnterpriseChoiceLibrary();

  const [workingQuestion, setWorkingQuestion] =
    useState(createEmptyWorkingQuestion);

  const [selectedQuestionType, setSelectedQuestionType] =
    useState(DEFAULT_QUESTION_TYPE);

 const selectedQuestionTypeMetadata =
  questionTypes.find(
    (questionType) =>
      String(
        questionType.type_code || ""
      )
        .trim()
        .toUpperCase() ===
      selectedQuestionType
  ) || null;  

  const availableSections = useMemo(() => {
    return getSectionsForQuestionType(
      selectedQuestionType
    );
  }, [selectedQuestionType]);

  const [activeSectionId, setActiveSectionId] =
    useState(
      availableSections[0]?.id ?? "general"
    );

  /*
   * Keep the workspace section engine synchronized
   * with the Question Type selected inside General Builder.
   */
  useEffect(() => {
    const normalizedQuestionType = String(
      workingQuestion.question_type ||
        DEFAULT_QUESTION_TYPE
    )
      .trim()
      .toUpperCase();

    if (
      registeredQuestionTypes.includes(
        normalizedQuestionType
      )
    ) {
      setSelectedQuestionType(
        normalizedQuestionType
      );
    }
  }, [
    registeredQuestionTypes,
    workingQuestion.question_type,
  ]);

  /*
   * When an existing Enterprise Question is selected,
   * load it into the local engineering workspace.
   */

 useEffect(() => {
  if (!selectedQuestion) {
    return;
  }

  setWorkingQuestion({
    ...createEmptyWorkingQuestion(),
    ...selectedQuestion,

    question_type:
      String(
        selectedQuestion.question_type ||
          DEFAULT_QUESTION_TYPE
      )
        .trim()
        .toUpperCase(),
  });

  if (selectedQuestion.question_id) {
    loadLogicByQuestionId(
      selectedQuestion.question_id
    ).catch(() => {
      /*
       * Error state is already handled
       * by useEnterpriseQuestionLogic.
       */
    });
  }

  if (selectedQuestion.choice_list_id) {
    loadChoiceListById(
      selectedQuestion.choice_list_id
    ).catch(() => {
      /*
       * Error state is already handled
       * by useEnterpriseChoiceLibrary.
       */
    });
  } else {
    clearChoiceList();
  }
}, [
  selectedQuestion,
  loadLogicByQuestionId,
  loadChoiceListById,
  clearChoiceList,
]);

  /*
   * Ensure the active editor section remains valid
   * whenever Question Type capabilities change.
   */
  useEffect(() => {
    const sectionStillAvailable =
      availableSections.some(
        (section) =>
          section.id === activeSectionId
      );

    if (!sectionStillAvailable) {
      setActiveSectionId(
        availableSections[0]?.id ?? "general"
      );
    }
  }, [
    activeSectionId,
    availableSections,
  ]);

  const activeSection =
    availableSections.find(
      (section) =>
        section.id === activeSectionId
    ) ?? availableSections[0];

  const questionObjectLabel =
    workingQuestion.question_code ||
    selectedQuestion?.question_code ||
    "Unsaved Draft";

  const questionBankStatus = loading
    ? "Loading"
    : error
      ? "Connection Error"
      : "Connected";

  function handleWorkspaceQuestionTypeChange(
    questionTypeCode
  ) {
    const normalizedQuestionType =
      String(questionTypeCode)
        .trim()
        .toUpperCase();

    const matchingQuestionType =
      questionTypes.find(
        (questionType) =>
          String(
            questionType.type_code || ""
          )
            .trim()
            .toUpperCase() ===
          normalizedQuestionType
      );

    setSelectedQuestionType(
      normalizedQuestionType
    );

    setWorkingQuestion(
      (currentQuestion) => ({
        ...currentQuestion,

        question_type:
          normalizedQuestionType,

        question_type_id:
          matchingQuestionType?.question_type_id ||
          null,
      })
    );
  }

 async function handleSaveQuestion() {
  if (!workingQuestion.question_code?.trim()) {
    window.alert("Question Code is required.");
    return;
  }

  if (!workingQuestion.question_text?.trim()) {
    window.alert("Question Text is required.");
    return;
  }

  if (!workingQuestion.question_type?.trim()) {
    window.alert("Question Type is required.");
    return;
  }

  const payload = {
    ...workingQuestion,

    question_code:
      workingQuestion.question_code.trim(),

    question_text:
      workingQuestion.question_text.trim(),

    question_type:
      workingQuestion.question_type.trim(),
  };

  try {
    let savedQuestion;

    if (workingQuestion.question_id) {
      savedQuestion = await updateQuestion(
        workingQuestion.question_id,
        payload
      );
    } else {
      savedQuestion = await createQuestion(
        payload
      );
    }

    setWorkingQuestion((currentQuestion) => ({
      ...currentQuestion,
      ...savedQuestion,
    }));

    window.alert(
      workingQuestion.question_id
        ? "Enterprise Question updated successfully."
        : "Enterprise Question saved successfully."
    );
  } catch (saveError) {
    window.alert(
      saveError?.response?.data?.message ||
        saveError?.response?.data?.error ||
        saveError?.message ||
        "Unable to save the Enterprise Question."
    );
  }
} 

function handleNewQuestion() {
  clearSelection();

  setWorkingQuestion(
    createEmptyWorkingQuestion()
  );

  setSelectedQuestionType(
    DEFAULT_QUESTION_TYPE
  );

  setActiveSectionId("general");
}

async function handleDeleteQuestion() {
  if (!workingQuestion.question_id) {
    window.alert(
      "Please open an existing question before deleting."
    );
    return;
  }

  const confirmed = window.confirm(
    `Delete ${workingQuestion.question_code}? This action cannot be undone.`
  );

  if (!confirmed) {
    return;
  }

  try {
    await removeQuestion(
      workingQuestion.question_id
    );

    handleNewQuestion();

    window.alert(
      "Enterprise Question deleted successfully."
    );
  } catch (deleteError) {
    window.alert(
      deleteError?.response?.data?.message ||
        deleteError?.response?.data?.error ||
        deleteError?.message ||
        "Unable to delete the Enterprise Question."
    );
  }
}

  return (
    <MainLayout>
      {metadataError && (
        <div className="dashboard-loading-error">
          {metadataError}
        </div>
      )}

      <section className="enterprise-question-editor">
        <header className="enterprise-question-editor__header">
          <div>
            <span className="enterprise-question-editor__eyebrow">
              Book III · Survey &amp; Census Engineering
            </span>

            <h1>Enterprise Question Editor</h1>

            <p>
              Build governed Enterprise Question Objects
              for surveys, censuses, research instruments,
              election studies, profiling, analytics,
              business intelligence, and artificial
              intelligence.
            </p>
          </div>

          <div className="enterprise-question-editor__toolbar">

<button
  type="button"
  onClick={handleNewQuestion}
  disabled={
    saving ||
    metadataLoading
  }
>
  New Question
</button>

<button
 type="button"
  onClick={handleSaveQuestion}
  disabled={
    saving ||
    metadataLoading
  }
  title={
    workingQuestion.question_id
      ? "Update this Enterprise Question."
      : "Save this new Enterprise Question."
  }
>
  <Save size={17} />

  {saving
    ? "Saving..."
    : workingQuestion.question_id
      ? "Update"
      : "Save"}
</button>

<button
  type="button"
  onClick={handleDeleteQuestion}
  disabled={
    deleting ||
    !workingQuestion.question_id
  }
>
  Delete
</button>

            <button
              type="button"
              disabled
              title="Validation will be enabled after the Validation Builder is connected."
            >
              <FileCheck2 size={17} />
              Validate
            </button>

            <button
              type="button"
              disabled
              title="Preview actions will be enabled after Live Preview integration."
            >
              <Eye size={17} />
              Preview
            </button>

            <button
              type="button"
              disabled
              title="Publishing will be enabled after lifecycle and governance integration."
            >
              <Send size={17} />
              Publish
            </button>
          </div>
        </header>

        <div className="enterprise-question-editor__status-bar">
          <div>
            <Database size={18} />

            <span>
              Question Object:
              <strong>
                {" "}
                {questionObjectLabel}
              </strong>
            </span>
          </div>

          <div>
            <span>
              Question Type:
              <strong>
                {" "}
                {formatQuestionTypeLabel(
                  selectedQuestionType
                )}
              </strong>
            </span>

            <span>
              Enabled Sections:
              <strong>
                {" "}
                {availableSections.length}
              </strong>
            </span>
          </div>
        </div>

        <section
          style={{
            marginTop: "18px",
            padding: "16px 18px",
            border: "1px solid #d9e2ec",
            borderRadius: "10px",
            background: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <span className="enterprise-question-editor__eyebrow">
              Live Enterprise Data Source
            </span>

            <h3
              style={{
                margin: "5px 0 6px",
              }}
            >
              Enterprise Question Bank
            </h3>

            <p
              style={{
                margin: 0,
              }}
            >
              Status:{" "}
              <strong>
                {questionBankStatus}
              </strong>
              {" · "}
              Questions:{" "}
              <strong>
                {loading
                  ? "..."
                  : questions.length}
              </strong>
            </p>

<div
  style={{
    minWidth: "280px",
    display: "grid",
    gap: "6px",
    marginTop: "12px",
  }}
>
  <label
    htmlFor="enterprise-question-bank-selector"
    style={{
      fontWeight: 700,
      fontSize: "13px",
    }}
  >
    Open Existing Question
  </label>

  <select
    id="enterprise-question-bank-selector"
    value={selectedQuestion?.question_id || ""}
    disabled={loading}
    onChange={(event) => {
      const questionId = event.target.value;

      if (!questionId) {
        return;
      }

      selectQuestion(questionId).catch(() => {
        /*
         * Error state is already handled
         * by useEnterpriseQuestionBank.
         */
      });
    }}
  >
    <option value="">
      Select from Question Bank
    </option>

    {questions.map((question) => (
      <option
        key={question.question_id}
        value={question.question_id}
      >
        {question.question_code} — {question.question_text}
      </option>
    ))}
  </select>
</div>

            {lastLoadedAt && !error && (
              <small
                style={{
                  display: "block",
                  marginTop: "6px",
                }}
              >
                Last synchronized:{" "}
                {lastLoadedAt.toLocaleString()}
              </small>
            )}

            {error && (
              <p
                style={{
                  marginTop: "8px",
                  marginBottom: 0,
                  color: "#b91c1c",
                }}
              >
                {error}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              refresh().catch(() => {
                /*
                 * Error state is handled inside
                 * useEnterpriseQuestionBank.
                 */
              });
            }}
            disabled={
              loading ||
              saving ||
              deleting
            }
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              cursor: loading
                ? "not-allowed"
                : "pointer",
            }}
          >
            <RefreshCw size={17} />

            {loading
              ? "Refreshing..."
              : "Refresh Question Bank"}
          </button>
        </section>

        <section className="enterprise-question-editor__type-selector">
          <div>
            <label htmlFor="enterprise-question-type">
              Question Type
            </label>

            <p>
              Selecting a Question Type automatically
              configures the editor sections and
              capabilities available in this workspace.
            </p>
          </div>

          <select
            id="enterprise-question-type"
            value={selectedQuestionType}
            onChange={(event) => {
              handleWorkspaceQuestionTypeChange(
                event.target.value
              );
            }}
          >
            {QUESTION_TYPE_GROUPS.map(
              (group) => {
                const validQuestionTypes =
                  group.questionTypes.filter(
                    (questionTypeCode) => {
                      return registeredQuestionTypes.includes(
                        questionTypeCode
                      );
                    }
                  );

                if (
                  validQuestionTypes.length === 0
                ) {
                  return null;
                }

                return (
                  <optgroup
                    key={group.label}
                    label={group.label}
                  >
                    {validQuestionTypes.map(
                      (questionTypeCode) => (
                        <option
                          key={
                            questionTypeCode
                          }
                          value={
                            questionTypeCode
                          }
                        >
                          {formatQuestionTypeLabel(
                            questionTypeCode
                          )}
                        </option>
                      )
                    )}
                  </optgroup>
                );
              }
            )}
          </select>
        </section>

        <section className="enterprise-question-editor__workspace">
          <aside className="enterprise-question-editor__sidebar">
            <div className="enterprise-question-editor__sidebar-header">
              <span className="enterprise-question-editor__eyebrow">
                Metadata-Driven Workspace
              </span>

              <h2>Editor Sections</h2>

              <p>
                Available sections are generated from
                the selected Question Type.
              </p>
            </div>

            <nav
              aria-label="Enterprise Question Editor sections"
              className="enterprise-question-editor__section-navigation"
            >
              {availableSections.map(
                (section) => {
                  const isActive =
                    section.id ===
                    activeSection?.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={
                        isActive
                          ? "enterprise-question-editor__section-button enterprise-question-editor__section-button--active"
                          : "enterprise-question-editor__section-button"
                      }
                      onClick={() => {
                        setActiveSectionId(
                          section.id
                        );
                      }}
                    >
                      <span>
                        <strong>
                          {section.label}
                        </strong>

                        <small>
                          {
                            section.description
                          }
                        </small>
                      </span>

                      <ChevronRight
                        size={18}
                      />
                    </button>
                  );
                }
              )}
            </nav>
          </aside>

          <main className="enterprise-question-editor__content">
            {activeSection ? (
              activeSection.id === "general" ? (
                <GeneralBuilder
                  question={workingQuestion}
                  questionTypes={questionTypes}
                  categories={categories}
                  onChange={setWorkingQuestion}
                  readOnly={metadataLoading}
                />

) : activeSection.id === "question" ? (
  <QuestionBuilder
    question={workingQuestion}
    onChange={setWorkingQuestion}
    readOnly={metadataLoading}
  />
) : activeSection.id === "validation" ? (
  <ValidationBuilder
    question={workingQuestion}
    questionTypeMetadata={selectedQuestionTypeMetadata}
    onChange={setWorkingQuestion}
    readOnly={metadataLoading}
  />

  ) : activeSection.id === "calculation" ? (
  <CalculationBuilder
    question={workingQuestion}
    onChange={setWorkingQuestion}
    readOnly={metadataLoading}
  />

  ) : activeSection.id === "appearance" ? (
  <AppearanceBuilder
    question={workingQuestion}
    onChange={setWorkingQuestion}
    readOnly={metadataLoading}
  />

) : activeSection.id === "logic" ? (

<LogicBuilder
  question={workingQuestion}
  onChange={setWorkingQuestion}
  readOnly={metadataLoading}
  logicRecords={logicRecords}
  selectedLogic={selectedLogic}
  logicLoading={logicLoading}
  logicError={logicError}
  onSelectLogic={loadLogicById}
  selectedChoiceList={selectedChoiceList}
choiceItems={choiceItems}
choiceLibraryLoading={choiceLibraryLoading}
choiceLibraryError={choiceLibraryError}
onCreateLogic={createLogic}
onUpdateLogic={updateLogic}
onDeleteLogic={removeLogic}
questions={questions}
/>

) : (              
                <EditorSectionPlaceholder
                  section={activeSection}
                  questionTypeCode={
                    selectedQuestionType
                  }
                />
              )
            ) : (
              <div className="enterprise-question-editor__empty-state">
                No editor sections are available
                for this Question Type.
              </div>
            )}
          </main>
        </section>
      </section>
    </MainLayout>
  );
}
