import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import { downloadSurveyData, getAnalyticsFrequencies, getSurveyResponses } from "../../../services/analyticsService";

export default function AnalyticsWorkspacePage() {
  const [analytics, setAnalytics] = useState({ total_responses: 0, frequency: {}, percentage: {} });
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedExportSurvey, setSelectedExportSurvey] = useState("");
  const [exporting, setExporting] = useState("");

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
      setSelectedExportSurvey((current) => current || responseResult.find((item) => item.survey_id)?.survey_id || "");
    } catch (loadError) {
      setError(loadError.message || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const surveyCount = useMemo(() => new Set(responses.map((item) => item.survey_id).filter(Boolean)).size, [responses]);
  const exportSurveys = useMemo(() => {
    const unique = new Map();
    responses.forEach((item) => {
      if (item.survey_id && !unique.has(item.survey_id)) {
        unique.set(item.survey_id, {
          survey_id: item.survey_id,
          label: `${item.survey_name || "Survey"} (${item.survey_code || item.survey_id})`,
        });
      }
    });
    return [...unique.values()];
  }, [responses]);
  const questionEntries = Object.entries(analytics.frequency || {});
  const candidateMetrics = analytics.candidate_metrics || [];
  const ballotEntries = Object.entries(analytics.ballot_frequency || {});

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
          <h2>Administrator Data Export</h2>
          <p>Download synchronized response data with governed variable labels, value labels, version metadata, and a codebook.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <select value={selectedExportSurvey} onChange={(event) => setSelectedExportSurvey(event.target.value)} disabled={exporting || exportSurveys.length === 0}>
              {exportSurveys.length === 0 && <option value="">No survey responses available</option>}
              {exportSurveys.map((survey) => <option key={survey.survey_id} value={survey.survey_id}>{survey.label}</option>)}
            </select>
            {[
              ["excel", "Download Excel (.xlsx)"],
              ["spss", "Download SPSS (.sav)"],
            ].map(([format, label]) => (
              <button
                key={format}
                type="button"
                disabled={!selectedExportSurvey || Boolean(exporting)}
                onClick={async () => {
                  try {
                    setError("");
                    setExporting(format);
                    await downloadSurveyData(selectedExportSurvey, format);
                  } catch (exportError) {
                    setError(exportError.message || "Unable to export survey data.");
                  } finally {
                    setExporting("");
                  }
                }}
              >
                {exporting === format ? "Preparing..." : label}
              </button>
            ))}
          </div>
        </div>

        {candidateMetrics.length > 0 && (
          <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14, overflowX: "auto" }}>
            <h2>Candidate Awareness, Satisfaction, and Trust Means</h2>
            <p>Lower means are more favorable under the configured coding. Aware-only means exclude automatically assigned neutral values.</p>
            <table style={{ width: "100%", marginTop: 12 }}>
              <thead>
                <tr>
                  <th align="left">Candidate</th>
                  <th align="right">Awareness Mean</th>
                  <th align="right">Satisfaction Mean</th>
                  <th align="right">Trust Mean</th>
                  <th align="right">Aware-only Satisfaction</th>
                  <th align="right">Aware-only Trust</th>
                  <th align="right">Auto-neutral</th>
                </tr>
              </thead>
              <tbody>
                {candidateMetrics.map((metric) => (
                  <tr key={metric.candidate_id}>
                    <td>{metric.candidate_label}</td>
                    <td align="right">{metric.awareness_mean ?? "—"}</td>
                    <td align="right">{metric.satisfaction_mean ?? "—"}</td>
                    <td align="right">{metric.trust_mean ?? "—"}</td>
                    <td align="right">{metric.aware_only_satisfaction_mean ?? "—"}</td>
                    <td align="right">{metric.aware_only_trust_mean ?? "—"}</td>
                    <td align="right">{metric.auto_neutral_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {ballotEntries.length > 0 && (
          <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14 }}>
            <h2>Neutral Ballot Frequencies</h2>
            {ballotEntries.map(([position, candidates]) => (
              <article key={position} style={{ borderTop: "1px solid #e2e8f0", padding: "14px 0" }}>
                <strong>{position.replaceAll("_", " ")}</strong>
                <table style={{ width: "100%", marginTop: 8 }}>
                  <thead><tr><th align="left">Candidate</th><th align="right">Selections</th></tr></thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.candidate_id}>
                        <td>{candidate.candidate_label}</td>
                        <td align="right">{candidate.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </article>
            ))}
          </div>
        )}

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
