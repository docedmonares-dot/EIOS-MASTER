import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Database,
  MapPinned,
  RadioTower,
  Users,
} from "lucide-react";

import LiveOperationsMap from "./LiveOperationsMap";

export default function ExecutiveCommandCenter({ summary = {}, jobSummary = {}, online = true }) {
  const totalDeployments = summary.total_deployments ?? 0;
  const activeEnumerators = summary.active_enumerators ?? 0;
  const todayAttendance = summary.today_attendance ?? 0;

  return (
    <section className="command-center">
      <div className="command-center__header">
        <div>
          <span className="command-center__overline">
            Live Executive Operations
          </span>

          <h2 className="command-center__title">
            Executive Command Center
          </h2>
        </div>

        <span className="command-center__live-status">
          <RadioTower size={16} />
          Live Monitoring
        </span>
      </div>

      <div className="command-center__top-grid">
        <article className="command-center__panel command-center__map-panel">
          <div className="command-center__panel-heading">
            <MapPinned size={20} />
            <h3>National Operations Map</h3>
          </div>

<div className="command-center__live-map">
  <LiveOperationsMap />
</div>
        </article>

        <article className="command-center__panel">
          <div className="command-center__panel-heading">
            <AlertTriangle size={20} />
            <h3>Executive Watch</h3>
          </div>

          <div className="command-center__watch-item">
            <CheckCircle2 size={18} />

            <div>
              <strong>{jobSummary.failed_jobs ? `${jobSummary.failed_jobs} failed jobs` : "No failed enterprise jobs"}</strong>
              <span>{jobSummary.failed_jobs ? "Technical review is required." : "No job failure currently requires attention."}</span>
            </div>
          </div>

          <div className="command-center__watch-item">
            <Clock3 size={18} />

            <div>
              <strong>{jobSummary.queued_jobs || 0} queued jobs</strong>
              <span>Enterprise work waiting for an available worker.</span>
            </div>
          </div>

          <div className="command-center__watch-item">
            <Database size={18} />

            <div>
              <strong>{online ? "Systems online" : "System check required"}</strong>
              <span>{online ? "Dashboard services are responding." : "One or more dashboard services did not respond."}</span>
            </div>
          </div>
        </article>
      </div>

      <div className="command-center__bottom-grid">
        <article className="command-center__panel">
          <div className="command-center__panel-heading">
            <Users size={20} />
            <h3>Field Operations</h3>
          </div>

          <div className="command-center__metric">
            <strong>{totalDeployments}</strong>
            <span>Total operational deployments</span>
          </div>

          <div className="command-center__metric">
            <strong>{activeEnumerators}</strong>
            <span>Enumerators currently clocked in</span>
          </div>
        </article>

        <article className="command-center__panel">
          <div className="command-center__panel-heading">
            <ClipboardCheck size={20} />
            <h3>Survey Operations</h3>
          </div>

          <div className="command-center__metric">
            <strong>{todayAttendance}</strong>
            <span>Attendance records today</span>
          </div>

          <div className="command-center__metric">
            <strong>{jobSummary.running_jobs || 0}</strong>
            <span>Enterprise jobs currently running</span>
          </div>
        </article>

        <article className="command-center__panel">
          <div className="command-center__panel-heading">
            <Activity size={20} />
            <h3>System Readiness</h3>
          </div>

          <div className="command-center__status">
            <span>API</span>
            <strong>{online ? "Online" : "Attention"}</strong>
          </div>

          <div className="command-center__status">
            <span>Database</span>
            <strong>{online ? "Online" : "Unverified"}</strong>
          </div>

          <div className="command-center__status">
            <span>Platform Status</span>
            <strong>{online ? "Operational" : "Attention"}</strong>
          </div>
        </article>
      </div>
    </section>
  );
}
