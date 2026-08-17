import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import { getSurveyDeployments } from "../../../services/surveyDeploymentService";
import { getGpsValidations, reviewGpsValidation } from "../../../services/gpsValidationService";

function messageFrom(error) {
  return error?.message || "Unable to load field deployments.";
}

export default function DeploymentOperationsPage({
  title = "Field Operations Control",
}) {
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [validations, setValidations] = useState([]);
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [reviewingId, setReviewingId] = useState("");

  const loadDeployments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [deploymentRows, validationRows] = await Promise.all([
        getSurveyDeployments(),
        getGpsValidations(),
      ]);
      setDeployments(deploymentRows);
      setValidations(validationRows);
    } catch (loadError) {
      setError(messageFrom(loadError));
    } finally {
      setLoading(false);
    }
  }, []);

  async function submitReview(validationId, status) {
    const justification = String(reviewDrafts[validationId] || "").trim();
    if (justification.length < 10) {
      setError("Enter a GPS review justification containing at least 10 characters.");
      return;
    }

    try {
      setReviewingId(validationId);
      setError("");
      await reviewGpsValidation(validationId, status, justification);
      setReviewDrafts((current) => ({ ...current, [validationId]: "" }));
      await loadDeployments();
    } catch (reviewError) {
      setError(messageFrom(reviewError));
    } finally {
      setReviewingId("");
    }
  }

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
    const pendingGps = validations.filter((item) => item.review_status === "Pending").length;
    return { total: deployments.length, ready, paused, pendingGps };
  }, [deployments, validations]);

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
          <article><span>GPS Reviews</span><strong>{summary.pendingGps}</strong></article>
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

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14, overflowX: "auto" }}>
          <h2>GPS Integrity Reviews</h2>
          <p>Review missing, inaccurate, or out-of-area interview locations with a documented justification.</p>
          {!loading && validations.length === 0 ? (
            <p>No GPS validation records are available.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Enumerator</th><th align="left">Validation</th><th align="left">Flags</th><th align="left">Area</th><th align="left">Review</th></tr></thead>
              <tbody>
                {validations.map((item) => (
                  <tr key={item.gps_validation_id}>
                    <td>{item.enumerator_name || "Unknown"}</td>
                    <td>{item.gps_validation_status}</td>
                    <td>{(item.gps_validation_flags || []).join(", ") || "None"}</td>
                    <td>{[item.region, item.province, item.municipality, item.barangay].filter(Boolean).join(" / ") || "Not configured"}</td>
                    <td>
                      {item.review_status === "Pending" ? (
                        <div style={{ minWidth: 280 }}>
                          <input
                            value={reviewDrafts[item.gps_validation_id] || ""}
                            onChange={(event) => setReviewDrafts((current) => ({ ...current, [item.gps_validation_id]: event.target.value }))}
                            placeholder="Document the review justification"
                            style={{ width: "100%", minHeight: 36 }}
                          />
                          <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                            <button type="button" disabled={reviewingId === item.gps_validation_id} onClick={() => submitReview(item.gps_validation_id, "Accepted")}>Accept Exception</button>
                            <button type="button" disabled={reviewingId === item.gps_validation_id} onClick={() => submitReview(item.gps_validation_id, "Rejected")}>Reject</button>
                          </div>
                        </div>
                      ) : (
                        <div><strong>{item.review_status}</strong><br /><small>{item.review_justification}</small></div>
                      )}
                    </td>
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
