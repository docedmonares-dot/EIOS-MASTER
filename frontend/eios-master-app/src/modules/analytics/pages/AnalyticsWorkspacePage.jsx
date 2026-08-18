import { useCallback, useEffect, useMemo, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import { downloadSurveyData, getBiAnalytics, getSurveyResponses } from "../../../services/analyticsService";

export default function AnalyticsWorkspacePage() {
  const [responses, setResponses] = useState([]);
  const [error, setError] = useState("");
  const [selectedExportSurvey, setSelectedExportSurvey] = useState("");
  const [exporting, setExporting] = useState("");
  const [biAnalytics, setBiAnalytics] = useState({ summaries: [], dimensions: [], crosstab: null });
  const [biLoading, setBiLoading] = useState(false);
  const [selectedBiQuestion, setSelectedBiQuestion] = useState("");
  const [selectedDimension, setSelectedDimension] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const responseResult = await getSurveyResponses();
      setResponses(responseResult);
      setSelectedExportSurvey((current) => current || responseResult.find((item) => item.survey_id)?.survey_id || "");
    } catch (loadError) {
      setError(loadError.message || "Unable to load analytics.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedExportSurvey) return;
    let active = true;
    setBiLoading(true);
    getBiAnalytics({
      surveyId: selectedExportSurvey,
      question: selectedBiQuestion,
      dimension: selectedDimension,
    })
      .then((result) => {
        if (!active) return;
        setBiAnalytics(result);
        setSelectedBiQuestion((current) => current || result.summaries?.[0]?.key || "");
        setSelectedDimension((current) => current || result.dimensions?.[0]?.key || "");
      })
      .catch((biError) => active && setError(biError.message || "Unable to load BI analytics."))
      .finally(() => active && setBiLoading(false));
    return () => { active = false; };
  }, [selectedExportSurvey, selectedBiQuestion, selectedDimension]);

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

  return (
    <MainLayout>
      <section className="administration-dashboard-page">
        <div className="administration-dashboard-page__header">
          <span className="administration-dashboard-page__overline">ENTERPRISE INTELLIGENCE</span>
          <h1>Analytics Intelligence Center</h1>
          <p>Review synchronized survey responses and frequency distributions across reusable question types.</p>
        </div>

        <div className="administration-dashboard-page__summary">
          <article><span>Responses</span><strong>{biAnalytics.total_responses || responses.length}</strong></article>
          <article><span>Surveys</span><strong>{surveyCount}</strong></article>
          <article><span>Analyzed Variables</span><strong>{biAnalytics.summaries?.length || 0}</strong></article>
          <article><span>Analytics Status</span><strong className="administration-dashboard-page__online">{error ? "ATTENTION" : "ONLINE"}</strong></article>
        </div>

        {error && <div role="alert" style={{ padding: 14, color: "#991b1b", background: "#fef2f2", borderRadius: 10 }}>{error}</div>}

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14 }}>
          <h2>Administrator Data Export</h2>
          <p>Download synchronized response data with governed variable labels, value labels, version metadata, and a codebook.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
            <select value={selectedExportSurvey} onChange={(event) => {
              setSelectedExportSurvey(event.target.value);
              setSelectedBiQuestion("");
              setSelectedDimension("");
            }} disabled={exporting || exportSurveys.length === 0}>
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

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14 }}>
          <h2>Dynamic BI Percentage Dashboard</h2>
          <p>All questions present in the response version are decoded from published metadata. Percentages use valid responses; multiple-response charts use respondents selecting each option.</p>
          {biLoading && <p>Building chart-ready analytics...</p>}
          {!biLoading && biAnalytics.summaries?.length === 0 && <p>No synchronized answers are available for the selected survey.</p>}

          <div style={{ display: "grid", gap: 18, marginTop: 16 }}>
            {(biAnalytics.summaries || []).map((summary) => (
              <details key={summary.key} open={summary.key === selectedBiQuestion} style={{ border: "1px solid #dbe5f1", borderRadius: 12, padding: 14 }}>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>{summary.label}</summary>
                <p style={{ color: "#52657f" }}>
                  {summary.section_title} · Valid base: {summary.valid_base} · Missing: {summary.missing_count} · {summary.percentage_basis}
                </p>
                <div style={{ display: "grid", gap: 10 }}>
                  {summary.categories.map((category) => (
                    <div key={category.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                        <span>{category.label}</span>
                        <strong>{category.count} ({category.percentage.toFixed(2)}%)</strong>
                      </div>
                      <div style={{ height: 14, borderRadius: 999, background: "#e2e8f0", overflow: "hidden", marginTop: 5 }}>
                        <div style={{ width: `${Math.min(category.percentage, 100)}%`, height: "100%", background: "#2563eb" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, padding: 20, background: "#fff", borderRadius: 14 }}>
          <h2>Demographic and Geographic Cross-tabulation</h2>
          <p>Select any analyzed question and compare it with a respondent-profile or Geographic Master dimension.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
            <label>
              <span>Question</span>
              <select value={selectedBiQuestion} onChange={(event) => setSelectedBiQuestion(event.target.value)} style={{ width: "100%" }}>
                {(biAnalytics.summaries || []).map((summary) => <option key={summary.key} value={summary.key}>{summary.label}</option>)}
              </select>
            </label>
            <label>
              <span>Demographic / Geographic Dimension</span>
              <select value={selectedDimension} onChange={(event) => setSelectedDimension(event.target.value)} style={{ width: "100%" }}>
                {(biAnalytics.dimensions || []).map((dimension) => <option key={dimension.key} value={dimension.key}>{dimension.label}</option>)}
              </select>
            </label>
          </div>

          {biAnalytics.crosstab && (
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <h3>{biAnalytics.crosstab.question.label} × {biAnalytics.crosstab.dimension.label}</h3>
              <table style={{ width: "100%" }}>
                <thead><tr><th align="left">Group</th><th align="left">Answer</th><th align="right">Count</th><th align="right">Column %</th></tr></thead>
                <tbody>
                  {biAnalytics.crosstab.groups.flatMap((group) =>
                    group.cells.map((cell, index) => (
                      <tr key={`${group.dimension}-${cell.answer}`}>
                        <td>{index === 0 ? `${group.dimension} (n=${group.base})` : ""}</td>
                        <td>{cell.answer}</td>
                        <td align="right">{cell.count}</td>
                        <td align="right">{cell.column_percentage.toFixed(2)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </section>
    </MainLayout>
  );
}
