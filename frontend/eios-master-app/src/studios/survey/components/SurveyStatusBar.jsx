export default function SurveyStatusBar({
  projectCount = 0,
  selectedCount = 0,
  loading = false,
  connected = true,
}) {
  return (
    <div className="survey-studio-statusbar">
      <span>
        {loading
          ? "Loading survey projects..."
          : connected
            ? `Survey Studio ready · ${projectCount} projects loaded`
            : "Survey Studio disconnected"}
      </span>

      <span>
        Selected: {selectedCount}
      </span>

      <span>
        Book III · Alpha
      </span>
    </div>
  );
}