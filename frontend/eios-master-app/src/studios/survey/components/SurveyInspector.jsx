import {
  EEUIBadge,
  EEUIPanel,
} from "../../../eeui";

export default function SurveyInspector({
  totalSurveys = 0,
  selectedCount = 0,
  draftSurveys = 0,
  publishedSurveys = 0,
  archivedSurveys = 0,
  loading = false,
  connected = true,
}) {
  return (
    <EEUIPanel
      title="Studio Information"
      subtitle="Survey Studio status"
    >
      <div className="survey-studio-inspector">
        <div>
          <span>Workspace</span>
          <strong>Survey Studio</strong>
        </div>

        <div>
          <span>Status</span>

          <EEUIBadge
            variant={
              connected
                ? "success"
                : "danger"
            }
            dot
          >
            {loading
              ? "Loading"
              : connected
                ? "Connected"
                : "Disconnected"}
          </EEUIBadge>
        </div>

        <div>
          <span>Total Surveys</span>
          <strong>{totalSurveys}</strong>
        </div>

        <div>
          <span>Selected</span>
          <strong>{selectedCount}</strong>
        </div>

        <div>
          <span>Draft Surveys</span>
          <strong>{draftSurveys}</strong>
        </div>

        <div>
          <span>Published</span>
          <strong>{publishedSurveys}</strong>
        </div>

        <div>
          <span>Archived</span>
          <strong>{archivedSurveys}</strong>
        </div>
      </div>
    </EEUIPanel>
  );
}