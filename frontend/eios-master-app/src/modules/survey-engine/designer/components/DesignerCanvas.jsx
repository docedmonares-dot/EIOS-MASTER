import {
  Check,
  FileText,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";
import { MapPinned } from "lucide-react";
import { isGeographicSelectorQuestion } from "../../runtime/questionTypeRegistry";

export default function DesignerCanvas({
  selectedSection = null,
  visibleItems = [],
  selectedItemId = "",
  saving = false,
  onSelectItem,
  onAddQuestion,
  onQuickCreateQuestion,
  onSaveQuestion,
  onToggleSection,
  onDeleteQuestion,
}) {
  const [quickAddOpen, setQuickAddOpen] =
    useState(false);

  const [questionText, setQuestionText] =
    useState("");

  const [editingItemId, setEditingItemId] =
    useState("");

  const [editingText, setEditingText] =
    useState("");

  const quickInputRef = useRef(null);
  const editInputRef = useRef(null);

  useEffect(() => {
    if (quickAddOpen) {
      quickInputRef.current?.focus();
    }
  }, [quickAddOpen]);

  useEffect(() => {
    if (editingItemId) {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }
  }, [editingItemId]);

  function openQuickAdd() {
    setQuestionText("");
    setQuickAddOpen(true);
    setEditingItemId("");
  }

  function closeQuickAdd() {
    if (saving) {
      return;
    }

    setQuestionText("");
    setQuickAddOpen(false);
  }

  async function submitQuickQuestion() {
    const cleanedQuestionText =
      questionText.trim();

    if (
      !cleanedQuestionText ||
      saving
    ) {
      return;
    }

    if (
      typeof onQuickCreateQuestion !==
      "function"
    ) {
      onAddQuestion?.();
      return;
    }

    const created =
      await onQuickCreateQuestion({
        question_text:
          cleanedQuestionText,
      });

    if (created !== false) {
      setQuestionText("");
      setQuickAddOpen(false);
    }
  }

  function handleQuickKeyDown(event) {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      submitQuickQuestion();
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeQuickAdd();
    }
  }

  function beginInlineEdit(item) {
    if (
      item.item_source !==
      "Survey Local"
    ) {
      onSelectItem?.(
        item.questionnaire_item_id
      );

      return;
    }

    onSelectItem?.(
      item.questionnaire_item_id
    );

    setEditingItemId(
      item.questionnaire_item_id
    );

    setEditingText(
      item.question_text || ""
    );

    setQuickAddOpen(false);
  }

  function cancelInlineEdit() {
    if (saving) {
      return;
    }

    setEditingItemId("");
    setEditingText("");
  }

  async function saveInlineEdit(item) {
    const cleanedText =
      editingText.trim();

    if (
      !cleanedText ||
      saving ||
      typeof onSaveQuestion !==
        "function"
    ) {
      return;
    }

    const saved =
      await onSaveQuestion({
        section_id:
          item.section_id || null,

        question_type_id:
          item.question_type_id,

        choice_list_id:
          item.choice_list_id || null,

        question_text:
          cleanedText,

        variable_name:
          item.variable_name || "",

        question_description:
          item.question_description ||
          "",

        help_text:
          item.help_text || "",

        placeholder_text:
          item.placeholder_text || "",

        required_flag:
          Boolean(
            item.required_flag
          ),

        is_sensitive:
          Boolean(
            item.is_sensitive
          ),

        is_personally_identifiable:
          Boolean(
            item.is_personally_identifiable
          ),

        page_number:
          Number(
            item.page_number || 1
          ),

        sort_order:
          Number(
            item.sort_order || 0
          ),

        default_value_json:
          item.default_value_json ||
          {},

        validation_rules_json:
          item.validation_rules_json ||
          [],

        appearance_json:
          item.appearance_json || {},

        settings_json:
          item.settings_json || {},

        metadata_json:
          item.metadata_json || {},

        logic_enabled:
          Boolean(
            item.logic_enabled
          ),

        calculation_expression:
          item.calculation_expression ||
          "",
      });

    if (saved !== false) {
      setEditingItemId("");
      setEditingText("");
    }
  }

  function handleEditKeyDown(
    event,
    item
  ) {
    if (
      event.key === "Enter" &&
      (event.ctrlKey ||
        event.metaKey)
    ) {
      event.preventDefault();
      saveInlineEdit(item);
    }

    if (event.key === "Escape") {
      event.preventDefault();
      cancelInlineEdit();
    }
  }

  return (
    <main className="survey-studio-canvas">
      <div className="survey-studio-canvas__header">
        <div>
          <span>
            Questionnaire Canvas
          </span>

          <h2>
            {selectedSection
              ?.section_title ||
              "Unassigned Questions"}
          </h2>

          <p>
            {selectedSection
              ?.section_description ||
              "Questions not yet assigned to a section."}
          </p>
        </div>

        <button
          type="button"
          onClick={openQuickAdd}
          disabled={saving}
        >
          <Plus size={18} />
          Add Question
        </button>

        {selectedSection && (
          <button
            type="button"
            onClick={onToggleSection}
            disabled={saving}
            title="Include or exclude this entire section from the compiled instrument"
          >
            {selectedSection.settings_json?.is_applicable === false
              ? "Include Section"
              : "Not Applicable"}
          </button>
        )}
      </div>

      {quickAddOpen && (
        <section className="survey-studio-quick-question">
          <div className="survey-studio-quick-question__header">
            <strong>
              New Question
            </strong>

            <button
              type="button"
              onClick={closeQuickAdd}
              disabled={saving}
              aria-label="Cancel new question"
            >
              <X size={18} />
            </button>
          </div>

          <textarea
            ref={quickInputRef}
            value={questionText}
            onChange={(event) =>
              setQuestionText(
                event.target.value
              )
            }
            onKeyDown={
              handleQuickKeyDown
            }
            rows={3}
            placeholder="Type your question here..."
            disabled={saving}
          />

          <div className="survey-studio-quick-question__actions">
            <span>
              Enter creates the
              question. Shift + Enter
              adds a new line.
            </span>

            <div>
              <button
                type="button"
                onClick={closeQuickAdd}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={
                  submitQuickQuestion
                }
                disabled={
                  saving ||
                  !questionText.trim()
                }
                className="survey-studio-quick-question__create"
              >
                {saving
                  ? "Creating..."
                  : "Create Question"}
              </button>
            </div>
          </div>
        </section>
      )}

      {visibleItems.length === 0 &&
      !quickAddOpen ? (
        <div className="questionnaire-designer-empty questionnaire-designer-empty--canvas">
          <FileText size={32} />

          <strong>
            No questions in this
            section yet
          </strong>

          <span>
            Click Add Question and
            begin typing.
          </span>

          <button
            type="button"
            onClick={openQuickAdd}
            disabled={saving}
          >
            <Plus size={17} />
            Add the first question
          </button>
        </div>
      ) : (
        <div className="survey-studio-question-list">
          {visibleItems.map(
            (item, index) => {
              const itemId =
                item.questionnaire_item_id;

              const selected =
                selectedItemId ===
                itemId;

              const editing =
                editingItemId ===
                itemId;

              return (
                <article
                  key={itemId}
                  className={
                    selected
                      ? "survey-studio-question survey-studio-question--selected"
                      : "survey-studio-question"
                  }
                  onClick={() =>
                    onSelectItem?.(
                      itemId
                    )
                  }
                >
                  <span className="survey-studio-question__number">
                    {index + 1}
                  </span>

                  <div
                    style={{
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <span>
                      {item.type_name ||
                        "Unknown Question Type"}
                    </span>

                    {editing ? (
                      <div
                        onClick={(
                          event
                        ) =>
                          event.stopPropagation()
                        }
                      >
                        <textarea
                          ref={
                            editInputRef
                          }
                          rows={3}
                          value={
                            editingText
                          }
                          onChange={(
                            event
                          ) =>
                            setEditingText(
                              event
                                .target
                                .value
                            )
                          }
                          onKeyDown={(
                            event
                          ) =>
                            handleEditKeyDown(
                              event,
                              item
                            )
                          }
                          disabled={
                            saving
                          }
                          style={{
                            width:
                              "100%",
                            marginTop:
                              "8px",
                            padding:
                              "10px 12px",
                            resize:
                              "vertical",
                          }}
                        />

                        <div
                          style={{
                            display:
                              "flex",
                            justifyContent:
                              "flex-end",
                            gap: "8px",
                            marginTop:
                              "8px",
                          }}
                        >
                          <button
                            type="button"
                            onClick={
                              cancelInlineEdit
                            }
                            disabled={
                              saving
                            }
                          >
                            <X
                              size={
                                16
                              }
                            />
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              saveInlineEdit(
                                item
                              )
                            }
                            disabled={
                              saving ||
                              !editingText.trim()
                            }
                          >
                            <Check
                              size={
                                16
                              }
                            />

                            {saving
                              ? "Saving..."
                              : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();
                          beginInlineEdit(
                            item
                          );
                        }}
                        style={{
                          display:
                            "block",
                          width:
                            "100%",
                          padding: 0,
                          border: 0,
                          background:
                            "transparent",
                          textAlign:
                            "left",
                          cursor:
                            item.item_source ===
                            "Survey Local"
                              ? "text"
                              : "default",
                        }}
                      >
                        <strong>
                          {item.question_text}
                        </strong>
                      </button>
                    )}

                    <small>
                      {item.variable_name ||
                        "No variable name"}{" "}
                      · {item.item_source}
                    </small>

                    {isGeographicSelectorQuestion(item) && (
                      <div className="survey-studio-question__runtime-hint">
                        <MapPinned size={15} />
                        Enterprise Geographic Master hierarchy
                      </div>
                    )}
                  </div>

                  {item.required_flag && (
                    <span className="survey-studio-question__required">
                      Required
                    </span>
                  )}

                  {item.item_source ===
                    "Survey Local" &&
                    !editing && (
                      <button
                        type="button"
                        aria-label="Edit question text"
                        onClick={(
                          event
                        ) => {
                          event.stopPropagation();
                          beginInlineEdit(
                            item
                          );
                        }}
                      >
                        <Pencil
                          size={16}
                        />
                      </button>
                    )}

                  {!editing && (
                    <button
                      type="button"
                      aria-label="Delete question"
                      title="Delete question"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (
                          window.confirm(
                            "Delete this question from the draft instrument? Published versions will not be changed."
                          )
                        ) {
                          onDeleteQuestion?.(itemId);
                        }
                      }}
                      disabled={saving}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </article>
              );
            }
          )}
        </div>
      )}

      {visibleItems.length > 0 &&
        !quickAddOpen && (
          <button
            type="button"
            className="survey-studio-canvas__add-bottom"
            onClick={openQuickAdd}
            disabled={saving}
          >
            <Plus size={18} />
            Add Question
          </button>
        )}
    </main>
  );
}
