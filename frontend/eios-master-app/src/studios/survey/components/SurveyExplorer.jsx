import {
  Archive,
  ClipboardList,
  FileText,
  LayoutTemplate,
  Rocket,
} from "lucide-react";

import {
  EEUIBadge,
  EEUIPanel,
} from "../../../eeui";

export default function SurveyExplorer({
  totalSurveys = 0,
  draftSurveys = 0,
  publishedSurveys = 0,
  archivedSurveys = 0,
}) {
  return (
    <EEUIPanel
      title="Survey Explorer"
      subtitle="Navigation"
      className="eeui-panel--flush"
    >
      <nav className="survey-studio-nav">
        <button
          type="button"
          className="survey-studio-nav__item survey-studio-nav__item--active"
        >
          <FileText size={18} />
          <span>All Surveys</span>

          <EEUIBadge size="small">
            {totalSurveys}
          </EEUIBadge>
        </button>

        <button
          type="button"
          className="survey-studio-nav__item"
        >
          <ClipboardList size={18} />
          <span>Drafts</span>

          <EEUIBadge
            size="small"
            variant="warning"
          >
            {draftSurveys}
          </EEUIBadge>
        </button>

        <button
          type="button"
          className="survey-studio-nav__item"
        >
          <Rocket size={18} />
          <span>Published</span>

          <EEUIBadge
            size="small"
            variant="success"
          >
            {publishedSurveys}
          </EEUIBadge>
        </button>

        <button
          type="button"
          className="survey-studio-nav__item"
        >
          <Archive size={18} />
          <span>Archived</span>

          <EEUIBadge size="small">
            {archivedSurveys}
          </EEUIBadge>
        </button>

        <button
          type="button"
          className="survey-studio-nav__item"
        >
          <LayoutTemplate size={18} />
          <span>Templates</span>
        </button>
      </nav>
    </EEUIPanel>
  );
}