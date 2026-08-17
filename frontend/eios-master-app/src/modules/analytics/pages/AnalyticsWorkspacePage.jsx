import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import { getAnalyticsFrequencies, getSurveyResponses } from "../../../services/analyticsService";

export default function AnalyticsWorkspacePage() {
  const [analytics, setAnalytics] = useState({ total_responses: 0, frequency: {}, percentage: {} });
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const [frequencyResult, responseResult] = await Promise.all([
        getAnalyticsFrequencies(),
        getSurveyResponses(),
      ]);
      setAnalytics(frequencyResult);
      setResponses(responseResult);
    } catch (loadError) {
      setError(loadError.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const surveyCount = useMemo(() => new Set(responses.map((item) => item.survey_id).filter(Boolean)).size, [responses]);
  const questionEntries = Object.entries(analytics.frequency || {});

  return (
    <MainLayout>
      <section className="administration-dashboard-page">
        <div className="administration-dashboard-page__header">
          <span className="administration-dashboard-page__overline">ENTERPRISE INTELLIGENCE</span>
          <h1>Analytics Intelligence Center</h1>
          <p>Review synchronized survey responses and frequency distributions across reusable question types.</p>
        </div>

        <div className="administration-dashboard-page__summary">
          <article><span>Responses</span><strong>{analytics.total_responses || responses.length}</strong></article>
          <article><span>Surveys</span><strong>{surveyCount}</strong></article>
          <article><span>Answered Variables</span><strong>{questionEntries.length}</strong></article>
          <article><span>Analytics Status</span><strong className="administration-dashboard-page__online">{error ? "ATTENTION" : "ONLINE"}</strong></article>
        </div>

        {error && <div role="alert" style={{ padding: 14, color: "#991b1b", background: "#fef2f2", borderRadius: 10 }}>{error}</div>}

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2>Frequency Distribution</h2>
            <button type="button" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
          </div>

          {!loading && questionEntries.length === 0 && <p>No synchronized answers are available for analysis.</p>}
          {questionEntries.map(([question, values]) => (
            <article key={question} style={{ borderTop: "1px solid #e2e8f0", padding: "14px 0" }}>
              <strong>{question}</strong>
              <table style={{ width: "100%", marginTop: 8 }}>
                <thead><tr><th align="left">Answer</th><th align="right">Count</th><th align="right">Percent</th></tr></thead>
                <tbody>
                  {Object.entries(values).map(([value, count]) => (
                    <tr key={value}>
                      <td>{value}</td>
                      <td align="right">{count}</td>
                      <td align="right">{analytics.percentage?.[question]?.[value] || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      </section>
    </MainLayout>
  );
}
