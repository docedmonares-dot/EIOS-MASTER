import {
  Library,
  Plus,
  Search,
} from "lucide-react";

const libraryTabs = [
  "Questions",
  "Choice Lists",
  "Sections",
  "Templates",
];

export default function DesignerLibrary({
  activeTab = "Questions",
  searchTerm = "",
  questions = [],
  saving = false,
  onTabChange,
  onSearchChange,
  onAddQuestion,
}) {
  return (
    <aside className="survey-studio-library">
      <div className="survey-studio-panel-title">
        <div>
          <span>Resources</span>
          <h2>Enterprise Library</h2>
        </div>

        <Library size={19} />
      </div>

      <div className="survey-studio-library__tabs">
        {libraryTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange?.(tab)}
            className={
              activeTab === tab
                ? "survey-studio-library__tab survey-studio-library__tab--active"
                : "survey-studio-library__tab"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <label className="survey-studio-library__search">
        <Search size={16} />

        <input
          type="search"
          value={searchTerm}
          onChange={(event) =>
            onSearchChange?.(event.target.value)
          }
          placeholder={`Search ${activeTab.toLowerCase()}...`}
        />
      </label>

      {activeTab === "Questions" ? (
        <div className="survey-studio-library__list">
          {questions.length === 0 ? (
            <div className="questionnaire-designer-empty">
              No reusable questions found.
            </div>
          ) : (
            questions.slice(0, 30).map((question) => (
              <article key={question.question_id}>
                <span>
                  {question.type_name || "Question"}
                </span>

                <strong>
                  {question.question_text}
                </strong>

                <small>
                  {question.category_name ||
                    "Uncategorized"}
                </small>

                <button
                  type="button"
                  onClick={() =>
                    onAddQuestion?.(question)
                  }
                  disabled={saving}
                  title="Add this enterprise question to the selected section"
                  aria-label={`Add ${question.question_text}`}
                >
                  <Plus size={15} />
                </button>
              </article>
            ))
          )}
        </div>
      ) : (
        <div className="survey-studio-placeholder-panel">
          <Library size={24} />

          <span>
            {activeTab} library will be connected
            in a later sprint.
          </span>
        </div>
      )}
    </aside>
  );
}