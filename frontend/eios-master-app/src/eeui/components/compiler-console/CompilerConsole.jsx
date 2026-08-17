import {
  AlertTriangle,
  CheckCircle2,
  CircleX,
  FileCode2,
  LoaderCircle,
  ShieldCheck,
  TerminalSquare,
  X,
} from "lucide-react";

import "./CompilerConsole.css";

function IssueList({
  title,
  issues = [],
  variant,
  icon: Icon,
}) {
  if (!issues.length) {
    return null;
  }

  return (
    <section
      className={`compiler-console__issues compiler-console__issues--${variant}`}
    >
      <div className="compiler-console__issues-header">
        <Icon size={17} />

        <strong>
          {title} ({issues.length})
        </strong>
      </div>

      <div className="compiler-console__issues-list">
        {issues.map((issue, index) => (
          <article
            key={[
              issue.code,
              issue.questionnaire_item_id,
              issue.section_id,
              index,
            ].join("-")}
          >
            <div>
              <strong>
                {issue.code || "COMPILER_ISSUE"}
              </strong>

              <span>
                {issue.message ||
                  "A compiler issue was detected."}
              </span>
            </div>

            <dl>
              {issue.variable_name && (
                <>
                  <dt>Variable</dt>
                  <dd>{issue.variable_name}</dd>
                </>
              )}

              {issue.section_id && (
                <>
                  <dt>Section</dt>
                  <dd>{issue.section_id}</dd>
                </>
              )}

              {issue.questionnaire_item_id && (
                <>
                  <dt>Item</dt>
                  <dd>
                    {issue.questionnaire_item_id}
                  </dd>
                </>
              )}
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

export default function CompilerConsole({
  open = false,
  compiling = false,
  result = null,
  errorMessage = "",
  durationMs = null,
  onClose,
}) {
  if (!open) {
    return null;
  }

  const validation =
    result?.validation ||
    result?.package?.validation ||
    null;

  const manifest =
    result?.package?.manifest ||
    null;

  const compiler =
    result?.compiler ||
    result?.package?.compiler ||
    null;

  const errors =
    validation?.errors || [];

  const warnings =
    validation?.warnings || [];

  const valid =
    validation?.valid === true;

  return (
    <section className="compiler-console">
      <header className="compiler-console__header">
        <div>
          <TerminalSquare size={20} />

          <div>
            <span>
              EIOS Metadata Compiler
            </span>

            <h2>
              Compiler Console
            </h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close compiler console"
        >
          <X size={18} />
        </button>
      </header>

      <div className="compiler-console__body">
        {compiling ? (
          <div className="compiler-console__loading">
            <LoaderCircle size={28} />

            <strong>
              Compiling instrument...
            </strong>

            <span>
              Reading metadata, resolving
              references, validating the
              instrument, and building the
              compiled package.
            </span>
          </div>
        ) : errorMessage ? (
          <div className="compiler-console__fatal">
            <CircleX size={28} />

            <strong>
              Compilation failed
            </strong>

            <span>{errorMessage}</span>
          </div>
        ) : result ? (
          <>
            <section className="compiler-console__summary">
              <article>
                <FileCode2 size={18} />

                <div>
                  <span>
                    Compiler
                  </span>

                  <strong>
                    {compiler?.name ||
                      "EIOS Metadata Compiler"}
                  </strong>

                  <small>
                    Version{" "}
                    {compiler?.version ||
                      "1.0.0"}
                  </small>
                </div>
              </article>

              <article>
                {valid ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <CircleX size={18} />
                )}

                <div>
                  <span>
                    Validation
                  </span>

                  <strong>
                    {valid
                      ? "Passed"
                      : "Failed"}
                  </strong>

                  <small>
                    {errors.length} errors ·{" "}
                    {warnings.length} warnings
                  </small>
                </div>
              </article>

              <article>
                <ShieldCheck size={18} />

                <div>
                  <span>
                    Offline Readiness
                  </span>

                  <strong>
                    {manifest?.offline_ready
                      ? "Ready"
                      : "Not Ready"}
                  </strong>

                  <small>
                    Package compatibility
                  </small>
                </div>
              </article>
            </section>

            <section className="compiler-console__metrics">
              <div>
                <span>Sections</span>
                <strong>
                  {manifest?.section_count ?? 0}
                </strong>
              </div>

              <div>
                <span>Questions</span>
                <strong>
                  {manifest?.question_count ?? 0}
                </strong>
              </div>

              <div>
                <span>Errors</span>
                <strong>
                  {manifest?.error_count ??
                    errors.length}
                </strong>
              </div>

              <div>
                <span>Warnings</span>
                <strong>
                  {manifest?.warning_count ??
                    warnings.length}
                </strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>
                  {durationMs === null
                    ? "—"
                    : `${durationMs} ms`}
                </strong>
              </div>
            </section>

            <section className="compiler-console__hash">
              <span>
                Schema Hash
              </span>

              <code>
                {manifest?.schema_hash ||
                  "Not generated"}
              </code>
            </section>

            <IssueList
              title="Errors"
              issues={errors}
              variant="error"
              icon={CircleX}
            />

            <IssueList
              title="Warnings"
              issues={warnings}
              variant="warning"
              icon={AlertTriangle}
            />

            {valid &&
              errors.length === 0 &&
              warnings.length === 0 && (
                <div className="compiler-console__success">
                  <CheckCircle2 size={22} />

                  <div>
                    <strong>
                      Compilation completed successfully
                    </strong>

                    <span>
                      The instrument passed all
                      current compiler checks.
                    </span>
                  </div>
                </div>
              )}
          </>
        ) : (
          <div className="compiler-console__empty">
            <TerminalSquare size={28} />

            <strong>
              No compilation result
            </strong>

            <span>
              Run the Metadata Compiler to
              inspect instrument readiness.
            </span>
          </div>
        )}
      </div>
    </section>
  );
}