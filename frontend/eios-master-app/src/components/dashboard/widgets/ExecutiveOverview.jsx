export default function ExecutiveOverview({ summary, online = true }) {
  return (
    <section className="executive-overview">
      <div className="overview-card">
        <span className="overview-label">
          Registered Enumerators
        </span>

        <h2 className="overview-value">
          {summary.total_enumerators}
        </h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">
          Operational Deployments
        </span>

        <h2 className="overview-value">
          {summary.total_deployments}
        </h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">
          Today's Attendance
        </span>

        <h2 className="overview-value">
          {summary.today_attendance}
        </h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">
          Currently Clocked-In
        </span>

        <h2 className="overview-value">
          {summary.active_enumerators}
        </h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">
          Average Field Hours
        </span>

        <h2 className="overview-value">
          {Number(summary.average_hours).toFixed(2)}
        </h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">
          System Status
        </span>

        <h2 className="overview-value status-online">
          {online ? "ONLINE" : "ATTENTION"}
        </h2>
      </div>
    </section>
  );
}
