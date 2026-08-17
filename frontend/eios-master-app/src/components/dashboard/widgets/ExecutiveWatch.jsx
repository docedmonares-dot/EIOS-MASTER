import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
} from "lucide-react";

export default function ExecutiveWatch() {
  return (
    <section className="executive-watch">
      <div className="executive-watch__header">
        <div>
          <span className="executive-watch__overline">
            Executive Watch
          </span>

          <h2 className="executive-watch__title">
            Attention and Decision Queue
          </h2>
        </div>

        <span className="executive-watch__count">
          2 items
        </span>
      </div>

      <div className="executive-watch__grid">
        <article className="executive-watch__card">
          <div className="executive-watch__card-heading">
            <AlertTriangle size={20} />

            <h3>Critical Alerts</h3>
          </div>

          <div className="executive-watch__item">
            <CheckCircle2 size={18} />

            <div>
              <strong>No critical incident</strong>
              <span>All monitored operations are stable.</span>
            </div>
          </div>
        </article>

        <article className="executive-watch__card">
          <div className="executive-watch__card-heading">
            <ClipboardCheck size={20} />

            <h3>Decision Queue</h3>
          </div>

          <div className="executive-watch__item">
            <Clock3 size={18} />

            <div>
              <strong>Attendance review pending</strong>
              <span>Supervisor verification is required.</span>
            </div>
          </div>
        </article>

        <article className="executive-watch__card">
          <div className="executive-watch__card-heading">
            <CheckCircle2 size={20} />

            <h3>System Health</h3>
          </div>

          <div className="executive-watch__status">
            <span>API</span>
            <strong>Online</strong>
          </div>

          <div className="executive-watch__status">
            <span>Database</span>
            <strong>Online</strong>
          </div>

          <div className="executive-watch__status">
            <span>Storage</span>
            <strong>98%</strong>
          </div>
        </article>
      </div>
    </section>
  );
}