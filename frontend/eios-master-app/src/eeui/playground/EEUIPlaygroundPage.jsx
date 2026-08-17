import {
  Bot,
  Check,
  Download,
  Eye,
  FilePlus2,
  Plus,
  Rocket,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";

import MainLayout from "../../layouts/MainLayout";

import {
  EEUIBadge,
  EEUIButton,
  EEUICard,
  EEUIChip,
  EEUIPanel,
  EEUIRibbon,
} from "../components";


const ribbonTabs = [
  { id: "home", label: "Home" },
  { id: "insert", label: "Insert" },
  { id: "logic", label: "Logic" },
  { id: "validation", label: "Validation" },
  { id: "ai", label: "AI" },
  { id: "preview", label: "Preview" },
  { id: "publish", label: "Publish" },
  { id: "deploy", label: "Deploy" },
];

function RibbonCommand({ icon: Icon, children }) {
  return (
    <button
      type="button"
      className="eeui-ribbon__command"
    >
      <Icon size={20} aria-hidden="true" />
      <span>{children}</span>
    </button>
  );
}

function renderRibbonCommands(activeTab) {
  const commandSets = {
    home: [
      [Save, "Save Draft"],
      [ShieldCheck, "Validate"],
      [Plus, "Add Question"],
      [FilePlus2, "Add Section"],
    ],
    insert: [
      [Plus, "Question"],
      [FilePlus2, "Section"],
      [Download, "Library Item"],
    ],
    logic: [
      [Sparkles, "Add Rule"],
      [ShieldCheck, "Check Logic"],
    ],
    validation: [
      [ShieldCheck, "Add Validation"],
      [Check, "Validate Survey"],
    ],
    ai: [
      [WandSparkles, "Generate Survey"],
      [Sparkles, "Improve Question"],
      [Bot, "AI Assistant"],
    ],
    preview: [[Eye, "Live Preview"]],
    publish: [
      [ShieldCheck, "Validate"],
      [Rocket, "Publish Version"],
    ],
    deploy: [[Rocket, "Deploy Survey"]],
  };

  return (
    <div className="eeui-ribbon__group">
      {(commandSets[activeTab] || []).map(
        ([Icon, label]) => (
          <RibbonCommand
            key={label}
            icon={Icon}
          >
            {label}
          </RibbonCommand>
        )
      )}
    </div>
  );
}

export default function EEUIPlaygroundPage() {
  return (
    <MainLayout>
      <section className="eeui-container eeui-stack eeui-gap-6">
        <header className="eeui-stack eeui-gap-2">
          <span className="eeui-page-overline">
            Book 0 · EEUI
          </span>

          <h1 className="eeui-page-title">
            EEUI Component Playground
          </h1>

          <p className="eeui-page-subtitle">
            Internal design-system laboratory for testing,
            documenting, and validating reusable EIOS
            interface components.
          </p>
        </header>

        {/* EEUIRibbon */}

        <section className="eeui-stack eeui-gap-5">
          <div>
            <span className="eeui-page-overline">
              Component
            </span>

            <h2 className="eeui-section-title">
              EEUIRibbon
            </h2>
          </div>

          <div className="eeui-elevation-1 eeui-radius-lg">
            <EEUIRibbon
              tabs={ribbonTabs}
              defaultTab="home"
              renderCommands={renderRibbonCommands}
              actions={
                <>
                  <EEUIBadge
                    variant="warning"
                    dot
                  >
                    Draft
                  </EEUIBadge>

                  <EEUIButton
                    size="small"
                    variant="secondary"
                    icon={Save}
                  >
                    Save
                  </EEUIButton>
                </>
              }
            />
          </div>
        </section>

        {/* EEUIButton */}

        <section className="eeui-elevation-1 eeui-radius-lg eeui-p-6 eeui-stack eeui-gap-5">
          <div>
            <span className="eeui-page-overline">
              Component
            </span>

            <h2 className="eeui-section-title">
              EEUIButton
            </h2>
          </div>

          <div className="eeui-stack eeui-gap-4">
            <div className="eeui-row eeui-wrap eeui-gap-3">
              <EEUIButton>Primary</EEUIButton>

              <EEUIButton variant="secondary">
                Secondary
              </EEUIButton>

              <EEUIButton variant="ghost">
                Ghost
              </EEUIButton>

              <EEUIButton variant="success">
                Success
              </EEUIButton>

              <EEUIButton variant="warning">
                Warning
              </EEUIButton>

              <EEUIButton variant="danger">
                Danger
              </EEUIButton>

              <EEUIButton variant="info">
                Information
              </EEUIButton>
            </div>

            <div className="eeui-row eeui-wrap eeui-gap-3">
              <EEUIButton size="small">
                Small
              </EEUIButton>

              <EEUIButton size="medium">
                Medium
              </EEUIButton>

              <EEUIButton size="large">
                Large
              </EEUIButton>
            </div>

            <div className="eeui-row eeui-wrap eeui-gap-3">
              <EEUIButton icon={Plus}>
                Add Record
              </EEUIButton>

              <EEUIButton
                variant="secondary"
                icon={Save}
              >
                Save Draft
              </EEUIButton>

              <EEUIButton
                variant="success"
                icon={Check}
                iconPosition="right"
              >
                Approve
              </EEUIButton>

              <EEUIButton
                variant="danger"
                icon={Trash2}
              >
                Delete
              </EEUIButton>

              <EEUIButton
                variant="secondary"
                icon={Download}
              >
                Download
              </EEUIButton>
            </div>

            <div className="eeui-row eeui-wrap eeui-gap-3">
              <EEUIButton loading>
                Processing
              </EEUIButton>

              <EEUIButton disabled>
                Disabled
              </EEUIButton>
            </div>

            <EEUIButton fullWidth>
              Full Width Button
            </EEUIButton>
          </div>
        </section>

        {/* EEUICard */}

        <section className="eeui-stack eeui-gap-5">
          <div>
            <span className="eeui-page-overline">
              Component
            </span>

            <h2 className="eeui-section-title">
              EEUICard
            </h2>
          </div>

          <EEUICard
            title="Barangay Public Opinion Survey"
            subtitle="Draft Questionnaire • Version 1.0"
          >
            <p>
              This reusable enterprise card component can be
              used throughout EIOS for dashboards, surveys,
              analytics, GIS, deployment, and administration.
            </p>
          </EEUICard>

          <EEUICard
            title="Interactive Card"
            subtitle="Hover to see interaction"
            interactive
          >
            <p>
              Interactive cards respond to hover and click
              actions.
            </p>
          </EEUICard>

          <EEUICard
            title="Selected Card"
            subtitle="Current Selection"
            selected
          >
            <p>
              Selected cards display the EEUI enterprise
              highlight styling.
            </p>
          </EEUICard>
        </section>

        {/* EEUIPanel */}

        <section className="eeui-stack eeui-gap-5">
          <div>
            <span className="eeui-page-overline">
              Component
            </span>

            <h2 className="eeui-section-title">
              EEUIPanel
            </h2>
          </div>

          <EEUIPanel
            title="Survey Outline"
            subtitle="Workspace navigation panel"
            headerActions={
              <EEUIButton
                size="small"
                variant="secondary"
                icon={Plus}
              >
                Add Section
              </EEUIButton>
            }
            footer="3 sections • 12 questions"
          >
            <div className="eeui-stack eeui-gap-3">
              <div className="eeui-p-3 eeui-radius-sm eeui-inset">
                Cover Page
              </div>

              <div className="eeui-p-3 eeui-radius-sm eeui-selected">
                Demographics
              </div>

              <div className="eeui-p-3 eeui-radius-sm eeui-inset">
                Closing
              </div>
            </div>
          </EEUIPanel>

          <EEUIPanel
            title="Properties Inspector"
            subtitle="Selected question settings"
            className="eeui-panel--compact eeui-panel--elevated"
          >
            <div className="eeui-stack eeui-gap-3">
              <label className="eeui-stack eeui-gap-1">
                <span className="eeui-label">
                  Question Type
                </span>

                <input
                  type="text"
                  value="Single Choice"
                  readOnly
                />
              </label>

              <label className="eeui-stack eeui-gap-1">
                <span className="eeui-label">
                  Variable Name
                </span>

                <input
                  type="text"
                  value="preferred_candidate"
                  readOnly
                />
              </label>
            </div>
          </EEUIPanel>

          <EEUIPanel
            title="Collapsed Panel"
            subtitle="Panel body is hidden"
            collapsed
          />
        </section>

        {/* EEUIBadge */}

        <section className="eeui-stack eeui-gap-5">
          <div>
            <span className="eeui-page-overline">
              Component
            </span>

            <h2 className="eeui-section-title">
              EEUIBadge
            </h2>
          </div>

          <div className="eeui-row eeui-wrap eeui-gap-3">
            <EEUIBadge>Neutral</EEUIBadge>

            <EEUIBadge variant="primary">
              Primary
            </EEUIBadge>

            <EEUIBadge variant="success">
              Published
            </EEUIBadge>

            <EEUIBadge variant="warning">
              Draft
            </EEUIBadge>

            <EEUIBadge variant="danger">
              Archived
            </EEUIBadge>

            <EEUIBadge variant="info">
              Information
            </EEUIBadge>
          </div>

          <div className="eeui-row eeui-wrap eeui-gap-3">
            <EEUIBadge dot>
              Active
            </EEUIBadge>

            <EEUIBadge
              variant="success"
              dot
            >
              Online
            </EEUIBadge>

            <EEUIBadge
              variant="danger"
              dot
            >
              Offline
            </EEUIBadge>
          </div>
        </section>

        {/* EEUIChip */}

        <section className="eeui-stack eeui-gap-5">
          <div>
            <span className="eeui-page-overline">
              Component
            </span>

            <h2 className="eeui-section-title">
              EEUIChip
            </h2>
          </div>

          <div className="eeui-row eeui-wrap eeui-gap-3">
            <EEUIChip>
              Neutral
            </EEUIChip>

            <EEUIChip variant="primary">
              Region IV-A
            </EEUIChip>

            <EEUIChip variant="success">
              Supporter
            </EEUIChip>

            <EEUIChip variant="warning">
              Undecided
            </EEUIChip>

            <EEUIChip variant="danger">
              Opponent
            </EEUIChip>

            <EEUIChip variant="info">
              Survey
            </EEUIChip>
          </div>

          <div className="eeui-row eeui-wrap eeui-gap-3">
            <EEUIChip selected>
              Selected
            </EEUIChip>

            <EEUIChip removable>
              Removable
            </EEUIChip>

            <EEUIChip
              variant="success"
              selected
            >
              Published
            </EEUIChip>
          </div>
        </section>
      </section>
    </MainLayout>
  );
}