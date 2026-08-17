import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import { getSurveyDeployments } from "../../../services/surveyDeploymentService";

function messageFrom(error) {
  return error?.message || "Unable to load field deployments.";
}

export default function DeploymentOperationsPage({
  title = "Field Operations Control",
}) {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeployments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setDeployments(await getSurveyDeployments());
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDeployments();
  }, [loadDeployments]);

  const summary = useMemo(() => {
    const ready = deployments.filter((item) =>
      ["ready", "deployed"].includes(
        String(item.deployment_status || "").toLowerCase()
      )
    ).length;
    const paused = deployments.filter(
      (item) => String(item.deployment_status || "").toLowerCase() === "paused"
    ).length;
    return { total: deployments.length, ready, paused };
  }, [deployments]);

  return (
    <MainLayout>
      <section className="administration-dashboard-page">
        <div className="administration-dashboard-page__header">
          <span className="administration-dashboard-page__overline">
            FIELD OPERATIONS
          </span>
          <h1>{title}</h1>
          <p>Monitor published survey packages, readiness, and field deployment versions.</p>
        </div>

        <div className="administration-dashboard-page__summary">
          <article><span>Total Packages</span><strong>{summary.total}</strong></article>
          <article><span>Ready / Deployed</span><strong>{summary.ready}</strong></article>
          <article><span>Paused</span><strong>{summary.paused}</strong></article>
          <article><span>API Status</span><strong className="administration-dashboard-page__online">{error ? "ATTENTION" : "ONLINE"}</strong></article>
        </div>

        {error && <div role="alert" style={{ padding: 14, color: "#991b1b", background: "#fef2f2", borderRadius: 10 }}>{error}</div>}

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14, overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h2>Survey Deployment Packages</h2>
            <button type="button" onClick={loadDeployments} disabled={loading}>
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>

          {!loading && deployments.length === 0 ? (
            <p>No deployment packages are available.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Survey</th><th align="left">Code</th><th align="left">Version</th><th align="left">Status</th><th align="left">Deployed</th></tr></thead>
              <tbody>
                {deployments.map((item) => (
                  <tr key={item.deployment_id}>
                    <td>{item.survey_name || "Untitled survey"}</td>
                    <td>{item.survey_code || "—"}</td>
                    <td>{item.version_label || item.version_number || "—"}</td>
                    <td>{item.deployment_status || "Unknown"}</td>
                    <td>{item.deployed_at ? new Date(item.deployed_at).toLocaleString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
