import { useCallback, useEffect, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import { getSystemHealth } from "../../../services/systemHealthService";

function formatBytes(value) {
  const bytes = Number(value || 0);
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SystemHealthPage() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setHealth(await getSystemHealth());
    } catch (checkError) {
      setError(checkError.message || "System health check failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { check(); }, [check]);

  return (
    <MainLayout>
      <section className="administration-dashboard-page">
        <div className="administration-dashboard-page__header">
          <span className="administration-dashboard-page__overline">PLATFORM OPERATIONS</span>
          <h1>System Health</h1>
          <p>Verify API runtime and PostgreSQL availability before client operations.</p>
        </div>

        <div className="administration-dashboard-page__summary">
          <article><span>API</span><strong className="administration-dashboard-page__online">{health?.api?.status || (error ? "ATTENTION" : "CHECKING")}</strong></article>
          <article><span>Database</span><strong className="administration-dashboard-page__online">{health?.database?.status || (error ? "ATTENTION" : "CHECKING")}</strong></article>
          <article><span>API Uptime</span><strong>{health ? `${health.api.uptime_seconds}s` : "—"}</strong></article>
          <article><span>Database Size</span><strong>{health ? formatBytes(health.database.size_bytes) : "—"}</strong></article>
        </div>

        {error && <div role="alert" style={{ padding: 14, color: "#991b1b", background: "#fef2f2", borderRadius: 10 }}>{error}</div>}

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14 }}>
          <h2>Readiness Check</h2>
          <p>Last checked: {health?.checked_at ? new Date(health.checked_at).toLocaleString() : "Not yet checked"}</p>
          <p>Database time: {health?.database?.database_time ? new Date(health.database.database_time).toLocaleString() : "—"}</p>
          <p>Runtime: {health?.api?.node_version || "—"}</p>
          <button type="button" onClick={check} disabled={loading}>{loading ? "Checking..." : "Run Health Check"}</button>
        </div>
      </section>
    </MainLayout>
  );
}
