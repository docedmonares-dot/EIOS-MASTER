import {
  Bot,
  Layers3,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const ribbonTabs = [
  "Home",
  "Insert",
  "Logic",
  "Validation",
  "AI",
  "Preview",
  "Publish",
  "Deploy",
];

export default function DesignerRibbon({
  activeTab = "Home",
  saving = false,
  onTabChange,
  onAddSection,
  onAddQuestion,
  onSaveDraft,
  onValidate,
  onPublish,
  onDeploy,
}) {
  return (
    <nav className="survey-studio-ribbon">
      <div className="survey-studio-ribbon__tabs">
        {ribbonTabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => onTabChange?.(tab)}
            className={
              activeTab === tab
                ? "survey-studio-ribbon__tab survey-studio-ribbon__tab--active"
                : "survey-studio-ribbon__tab"
            }
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="survey-studio-ribbon__commands">
        {activeTab === "Home" && (
          <>
            <button
              type="button"
              onClick={onAddSection}
              disabled={saving}
            >
              <Layers3 size={18} />
              <span>Add Section</span>
            </button>

            <button
              type="button"
              onClick={onAddQuestion}
              disabled={saving}
            >
              <Plus size={18} />
              <span>Add Question</span>
            </button>

            <button
              type="button"
              onClick={onSaveDraft}
              disabled={saving}
            >
              <Save size={18} />
              <span>
                {saving ? "Saving..." : "Save Draft"}
              </span>
            </button>

            <button
              type="button"
              onClick={onValidate}
              disabled={saving}
            >
              <ShieldCheck size={18} />
              <span>Validate</span>
            </button>
          </>
        )}

        {activeTab === "AI" && (
          <>
            <button type="button">
              <WandSparkles size={18} />
              <span>Generate Survey</span>
            </button>

            <button type="button">
              <Sparkles size={18} />
              <span>Improve Question</span>
            </button>

            <button type="button">
              <Bot size={18} />
              <span>AI Assistant</span>
            </button>
          </>
        )}

        {!["Home", "AI"].includes(activeTab) && (
          <button
            type="button"
            onClick={
              activeTab === "Publish"
                ? onPublish
                : activeTab === "Deploy"
                  ? onDeploy
                  : undefined
            }
            disabled={saving}
          >
            <Settings2 size={18} />

            <span>
              Open {activeTab} Studio
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}
