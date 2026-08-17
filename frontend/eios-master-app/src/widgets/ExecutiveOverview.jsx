export default function ExecutiveOverview({ summary }) {
  return (
    <section className="executive-overview">

      <div className="overview-card">
        <span className="overview-label">Registered Enumerators</span>
        <h2>{summary?.total_enumerators ?? 0}</h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">Active Deployments</span>
        <h2>{summary?.total_deployments ?? 0}</h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">Today's Attendance</span>
        <h2>{summary?.today_attendance ?? 0}</h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">Clocked-In</span>
        <h2>{summary?.active_enumerators ?? 0}</h2>
      </div>

      <div className="overview-card">
        <span className="overview-label">Average Hours</span>
        <h2>{Number(summary?.average_hours ?? 0).toFixed(2)}</h2>
      </div>

      <div className="overview-card status-online">
        <span className="overview-label">System Status</span>
        <h2>ONLINE</h2>
      </div>

    </section>
  );
}