import {
  CheckCircle2,
  Cloud,
} from "lucide-react";

export default function DesignerStatusBar({
  survey = null,
  sectionCount = 0,
  questionCount = 0,
  saving = false,
  connected = true,
}) {
  return (
    <footer className="survey-studio-statusbar">
      <span>
        <Cloud size={14} />

        {saving
          ? "Saving changes..."
          : "Autosave ready"}
      </span>

      <span>
        Status:{" "}
        <strong>
          {survey?.publication_status ||
            "Draft"}
        </strong>
      </span>

      <span>
        Version:{" "}
        <strong>
          {survey?.current_version_number ||
            0}
        </strong>
      </span>

      <span>
        Sections:{" "}
        <strong>{sectionCount}</strong>
      </span>

      <span>
        Questions:{" "}
        <strong>{questionCount}</strong>
      </span>

      <span>
        <CheckCircle2 size={14} />

        {connected
          ? "Workspace connected"
          : "Workspace disconnected"}
      </span>
    </footer>
  );
}