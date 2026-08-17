import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MapPinned,
  RadioTower,
  UsersRound,
} from "lucide-react";

export default function ExecutiveSituationRoom() {
  return (
    <section className="situation-room">
      <div className="situation-room__header">
        <div>
          <span className="situation-room__overline">
            Live Executive Situation Room
          </span>

          <h2 className="situation-room__title">
            National Operations Snapshot
          </h2>
        </div>

        <div className="situation-room__live-status">
          <span className="situation-room__live-dot" />
          Live Monitoring
        </div>
      </div>

      <div className="situation-room__grid">
        <article className="situation-panel situation-panel--map">
          <div className="situation-panel__heading">
            <MapPinned size={20} />
            <span>Operations Map</span>
          </div>

          <div className="situation-map-placeholder">
            <MapPinned size={44} />

            <strong>GIS Operations Map</strong>

            <span>
              Regional deployments and field activity will appear here.
            </span>
          </div>
        </article>

        <article className="situation-panel">
          <div className="situation-panel__heading">
            <AlertTriangle size={20} />
            <span>Critical Alerts</span>
          </div>

          <div className="situation-list">
            <div className="situation-list__item">
              <AlertTriangle size={18} />

              <div>
                <strong>No critical incident</strong>
                <span>All monitored operations are stable.</span>
              </div>
            </div>

            <div className="situation-list__item">
              <Clock3 size={18} />

              <div>
                <strong>1 pending attendance review</strong>
                <span>Requires supervisor verification.</span>
              </div>
            </div>
          </div>
        </article>

        <article className="situation-panel">
          <div className="situation-panel__heading">
            <UsersRound size={20} />
            <span>Field Deployment</span>
          </div>

          <div className="situation-metric">
            <strong>1</strong>
            <span>Active deployment</span>
          </div>

          <div className="situation-metric">
            <strong>1</strong>
            <span>Enumerator currently clocked in</span>
          </div>
        </article>

        <article className="situation-panel">
          <div className="situation-panel__heading">
            <RadioTower size={20} />
            <span>System Readiness</span>
          </div>

          <div className="situation-list">
            <div className="situation-list__item situation-list__item--success">
              <CheckCircle2 size={18} />

              <div>
                <strong>API Online</strong>
                <span>Backend services are responding.</span>
              </div>
            </div>

            <div className="situation-list__item situation-list__item--success">
              <CheckCircle2 size={18} />

              <div>
                <strong>Database Online</strong>
                <span>PostgreSQL connection is active.</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}