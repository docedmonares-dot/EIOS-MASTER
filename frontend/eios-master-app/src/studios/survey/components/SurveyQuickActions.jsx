import {
  ClipboardList,
  FilePlus2,
  LayoutTemplate,
} from "lucide-react";

import { EEUICard } from "../../../eeui";

export default function SurveyQuickActions({
  onCreateSurvey,
  onOpenDesigner,
  onOpenTemplates,
}) {
  return (
    <section className="survey-studio-home__actions">
      <EEUICard
        title="Create Survey"
        subtitle="Start a new survey project"
        icon={FilePlus2}
        interactive
        onClick={onCreateSurvey}
      >
        <p>
          Configure coverage, organization, schedule,
          purpose, and publication settings.
        </p>
      </EEUICard>

      <EEUICard
        title="Questionnaire Designer"
        subtitle="Build the survey instrument"
        icon={ClipboardList}
        interactive
        onClick={onOpenDesigner}
      >
        <p>
          Create sections, questions, logic, validation,
          calculations, and reusable content.
        </p>
      </EEUICard>

      <EEUICard
        title="Survey Templates"
        subtitle="Reuse proven instruments"
        icon={LayoutTemplate}
        interactive
        onClick={onOpenTemplates}
      >
        <p>
          Begin from organizational, national, or
          sector-specific survey templates.
        </p>
      </EEUICard>
    </section>
  );
}