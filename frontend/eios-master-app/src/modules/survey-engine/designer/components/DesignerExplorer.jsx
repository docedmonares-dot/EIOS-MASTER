import {
  CirclePlus,
  FileText,
  Layers3,
} from "lucide-react";

export default function DesignerExplorer({
  sections = [],
  questionnaireItems = [],
  selectedSectionId = "",
  onSelectSection,
  onAddSection,
}) {
  const unassignedCount =
    questionnaireItems.filter(
      (item) => !item.section_id
    ).length;

  return (
    <aside className="survey-studio-explorer">
      <div className="survey-studio-panel-title">
        <div>
          <span>Survey Outline</span>
          <h2>Sections</h2>
        </div>

        <button
          type="button"
          onClick={onAddSection}
          aria-label="Add section"
        >
          <CirclePlus size={19} />
        </button>
      </div>

      <button
        type="button"
        onClick={() =>
          onSelectSection?.("")
        }
        className={
          selectedSectionId
            ? "survey-studio-outline-item"
            : "survey-studio-outline-item survey-studio-outline-item--active"
        }
      >
        <FileText size={18} />

        <div>
          <strong>
            Unassigned Questions
          </strong>

          <span>
            {unassignedCount} items
          </span>
        </div>
      </button>

      {sections.map((section) => {
        const itemCount =
          questionnaireItems.filter(
            (item) =>
              item.section_id ===
              section.section_id
          ).length;

        const isSelected =
          selectedSectionId ===
          section.section_id;

        return (
          <button
            key={section.section_id}
            type="button"
            onClick={() =>
              onSelectSection?.(
                section.section_id
              )
            }
            className={
              isSelected
                ? "survey-studio-outline-item survey-studio-outline-item--active"
                : "survey-studio-outline-item"
            }
          >
            <Layers3 size={18} />

            <div>
              <strong>
                {section.section_title}
              </strong>

              <span>
                {section.section_type} ·{" "}
                {itemCount} items ·{" "}
                {section.settings_json?.is_applicable === false
                  ? "Off"
                  : "On"}
              </span>
            </div>
          </button>
        );
      })}

      {sections.length === 0 && (
        <div className="questionnaire-designer-empty">
          No sections yet.
        </div>
      )}
    </aside>
  );
}
