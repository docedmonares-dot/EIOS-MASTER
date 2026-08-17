import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function PreviewNavigation({
  sections = [],
  activeSectionIndex = 0,
  canGoPrevious = false,
  canGoNext = false,
  progressPercent = 0,
  onPrevious,
  onNext,
  onGoToSection,
}) {
  return (
    <nav className="preview-navigation">
      <div className="preview-navigation__progress">
        <div className="preview-navigation__progress-label">
          <span>
            Section{" "}
            {sections.length === 0
              ? 0
              : activeSectionIndex + 1}{" "}
            of {sections.length}
          </span>

          <strong>
            {progressPercent}%
          </strong>
        </div>

        <div
          className="preview-navigation__progress-track"
          aria-label={`Preview progress: ${progressPercent}%`}
        >
          <div
            className="preview-navigation__progress-value"
            style={{
              width: `${progressPercent}%`,
            }}
          />
        </div>
      </div>

      <div className="preview-navigation__sections">
        {sections.map((section, index) => (
          <button
            key={
              section.section_id ||
              section.section_code ||
              index
            }
            type="button"
            onClick={() =>
              onGoToSection?.(index)
            }
            className={
              index === activeSectionIndex
                ? "preview-navigation__section preview-navigation__section--active"
                : "preview-navigation__section"
            }
          >
            <span>
              {index + 1}
            </span>

            <strong>
              {section.section_title ||
                `Section ${index + 1}`}
            </strong>
          </button>
        ))}
      </div>

      <div className="preview-navigation__actions">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft size={17} />
          Previous
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="preview-navigation__next"
        >
          Next
          <ChevronRight size={17} />
        </button>
      </div>
    </nav>
  );
}