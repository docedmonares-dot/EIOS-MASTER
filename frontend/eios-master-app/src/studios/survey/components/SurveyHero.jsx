import { Plus } from "lucide-react";

import { EEUIButton } from "../../../eeui";

export default function SurveyHero({
  onCreateSurvey,
}) {
  return (
    <section className="survey-studio-home__hero">
      <div>
        <span className="eeui-page-overline">
          Book III
        </span>

        <h2>
          Dynamic Survey Engine
        </h2>

        <p>
          Build reusable, version-controlled
          survey instruments without changing
          source code.
        </p>
      </div>

      <EEUIButton
        icon={Plus}
        onClick={onCreateSurvey}
      >
        Create Survey Project
      </EEUIButton>
    </section>
  );
}