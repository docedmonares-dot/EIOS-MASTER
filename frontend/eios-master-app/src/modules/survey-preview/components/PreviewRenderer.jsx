import {
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";

import {
  PreviewNavigation,
  PreviewSection,
} from "./index";

export default function PreviewRenderer({
  form = null,
  manifest = null,
  validation = null,
  sections = [],
  activeSection = null,
  activeSectionIndex = 0,
  responses = {},
  canGoPrevious = false,
  canGoNext = false,
  progressPercent = 0,
  onResponseChange,
  onPrevious,
  onNext,
  onGoToSection,
}) {
  if (!form) {
    return (
      <div className="preview-renderer__empty">
        <FileText size={30} />

        <strong>
          No compiled form available
        </strong>

        <span>
          Compile the survey before opening
          the Preview Engine.
        </span>
      </div>
    );
  }

  const errorCount =
    validation?.summary?.error_count ??
    validation?.errors?.length ??
    manifest?.error_count ??
    0;

  const warningCount =
    validation?.summary?.warning_count ??
    validation?.warnings?.length ??
    manifest?.warning_count ??
    0;

  return (
    <div className="preview-renderer">
      <header className="preview-renderer__form-header">
        <div>
          <span>
            Compiled Survey Preview
          </span>

          <h1>
            {form.form_name ||
              "Untitled Form"}
          </h1>

          <p>
            {form.description ||
              form.purpose ||
              "No description provided."}
          </p>
        </div>

        <div className="preview-renderer__form-meta">
          <article>
            <span>Code</span>
            <strong>
              {form.form_code || "—"}
            </strong>
          </article>

          <article>
            <span>Version</span>
            <strong>
              {form.current_version_number ??
                0}
            </strong>
          </article>

          <article>
            <span>Status</span>
            <strong>
              {form.publication_status ||
                "Draft"}
            </strong>
          </article>
        </div>
      </header>

      <section className="preview-renderer__quality">
        <div
          className={
            errorCount === 0
              ? "preview-renderer__quality-item preview-renderer__quality-item--success"
              : "preview-renderer__quality-item preview-renderer__quality-item--error"
          }
        >
          {errorCount === 0 ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          <span>
            {errorCount === 0
              ? "No compilation errors"
              : `${errorCount} compilation errors`}
          </span>
        </div>

        <div
          className={
            warningCount === 0
              ? "preview-renderer__quality-item preview-renderer__quality-item--success"
              : "preview-renderer__quality-item preview-renderer__quality-item--warning"
          }
        >
          {warningCount === 0 ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertTriangle size={17} />
          )}

          <span>
            {warningCount === 0
              ? "No compilation warnings"
              : `${warningCount} compilation warnings`}
          </span>
        </div>

        <div className="preview-renderer__quality-item">
          <span>
            {manifest?.question_count ?? 0} questions
          </span>
        </div>

        <div className="preview-renderer__quality-item">
          <span>
            {manifest?.section_count ?? 0} sections
          </span>
        </div>
      </section>

      <div className="preview-renderer__workspace">
        <aside className="preview-renderer__navigation-panel">
          <PreviewNavigation
            sections={sections}
            activeSectionIndex={
              activeSectionIndex
            }
            canGoPrevious={
              canGoPrevious
            }
            canGoNext={canGoNext}
            progressPercent={
              progressPercent
            }
            onPrevious={onPrevious}
            onNext={onNext}
            onGoToSection={
              onGoToSection
            }
          />
        </aside>

        <main className="preview-renderer__canvas">
          <PreviewSection
            section={activeSection}
            sectionNumber={
              activeSectionIndex + 1
            }
            responses={responses}
            onResponseChange={
              onResponseChange
            }
            contextResponses={responses}
            canGoPrevious={canGoPrevious}
            canGoNext={canGoNext}
            onPrevious={onPrevious}
            onNext={onNext}
          />
        </main>
      </div>
    </div>
  );
}
