import {
  ClipboardList,
  FilePlus2,
  FolderOpen,
  LayoutTemplate,
  Settings2,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  EEUIBadge,
  EEUIDialog,
  EEUIRibbon,
  EEUIWorkspace,
} from "../../../eeui";

import {
  SurveyExplorer,
  SurveyHero,
  SurveyInspector,
  SurveyProjectForm,
  SurveyProjectsPanel,
  SurveyQuickActions,
  SurveyStatusBar,
} from "../components";

import {
  useSurveyStudio,
} from "../hooks";

import "./SurveyStudioHomePage.css";

const ribbonTabs = [
  {
    id: "home",
    label: "Home",
  },
  {
    id: "projects",
    label: "Projects",
  },
  {
    id: "templates",
    label: "Templates",
  },
  {
    id: "question-bank",
    label: "Question Bank",
  },
  {
    id: "publishing",
    label: "Publishing",
  },
];

export default function SurveyStudioHomePage() {
  const navigate = useNavigate();

  const {
    filteredProjects,
    summary,

    searchTerm,
    setSearchTerm,

    selectedProjectIds,
    setSelectedProjectIds,

    archivedSurveys,

    loading,
    connected,
    errorMessage,

    createDialogOpen,
    setCreateDialogOpen,

    submitting,
    setSubmitting,
  } = useSurveyStudio();

  function handleCreateSurvey() {
    setCreateDialogOpen(true);
  }

  function handleCloseCreateDialog() {
    if (submitting) {
      return;
    }

    setCreateDialogOpen(false);
  }

  async function handleSubmitCreateSurvey(
    formData
  ) {
    /*
     * The real POST request will be connected
     * in the next backend integration step.
     */
    setSubmitting(true);

    try {
      console.log(
        "CREATE SURVEY PAYLOAD:",
        formData
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenProject(project) {
    if (!project?.survey_id) {
      navigate("/survey-builder");
      return;
    }

    navigate(
      `/survey-builder/${project.survey_id}/designer`
    );
  }

  function handleOpenDesigner() {
    if (selectedProjectIds.length === 1) {
      navigate(
        `/survey-builder/${selectedProjectIds[0]}/designer`
      );

      return;
    }

    navigate("/survey-builder");
  }

  function handleOpenTemplates() {
    navigate("/survey-builder");
  }

  function renderRibbonCommands(activeTab) {
    if (activeTab === "home") {
      return (
        <>
          <div className="eeui-ribbon__group">
            <button
              type="button"
              className="eeui-ribbon__command"
              onClick={handleCreateSurvey}
            >
              <FilePlus2 size={20} />

              <span>New Survey</span>
            </button>

            <button
              type="button"
              className="eeui-ribbon__command"
              onClick={handleOpenDesigner}
            >
              <FolderOpen size={20} />

              <span>Open Survey</span>
            </button>
          </div>

          <div className="eeui-ribbon__group">
            <button
              type="button"
              className="eeui-ribbon__command"
              onClick={handleOpenTemplates}
            >
              <LayoutTemplate size={20} />

              <span>Use Template</span>
            </button>

            <button
              type="button"
              className="eeui-ribbon__command"
              onClick={() =>
                navigate("/survey-builder")
              }
            >
              <ClipboardList size={20} />

              <span>Question Bank</span>
            </button>
          </div>
        </>
      );
    }

    return (
      <div className="eeui-ribbon__group">
        <button
          type="button"
          className="eeui-ribbon__command"
        >
          <Settings2 size={20} />

          <span>Open {activeTab}</span>
        </button>
      </div>
    );
  }

  return (
    <>
      <EEUIWorkspace
        title="Survey Studio"
        subtitle="Create, manage, design, publish, and deploy enterprise survey instruments."
        ribbon={
          <EEUIRibbon
            tabs={ribbonTabs}
            defaultTab="home"
            renderCommands={
              renderRibbonCommands
            }
            actions={
              <EEUIBadge
                variant={
                  connected
                    ? "success"
                    : "danger"
                }
                dot
              >
                {connected
                  ? "Studio Ready"
                  : "Disconnected"}
              </EEUIBadge>
            }
          />
        }
        explorer={
          <SurveyExplorer
            totalSurveys={
              summary.total_surveys
            }
            draftSurveys={
              summary.draft_surveys
            }
            publishedSurveys={
              summary.published_surveys
            }
            archivedSurveys={
              archivedSurveys
            }
          />
        }
        canvas={
          <div className="survey-studio-home">
            {errorMessage && (
              <div className="enterprise-foundation-state enterprise-foundation-state--error">
                {errorMessage}
              </div>
            )}

            <SurveyHero
              onCreateSurvey={
                handleCreateSurvey
              }
            />

            <SurveyQuickActions
              onCreateSurvey={
                handleCreateSurvey
              }
              onOpenDesigner={
                handleOpenDesigner
              }
              onOpenTemplates={
                handleOpenTemplates
              }
            />

            <SurveyProjectsPanel
              projects={filteredProjects}
              loading={loading}
              searchTerm={searchTerm}
              selectedProjectIds={
                selectedProjectIds
              }
              onSearchChange={
                setSearchTerm
              }
              onSelectionChange={
                setSelectedProjectIds
              }
              onCreateSurvey={
                handleCreateSurvey
              }
              onOpenProject={
                handleOpenProject
              }
            />
          </div>
        }
        inspector={
          <SurveyInspector
            totalSurveys={
              summary.total_surveys
            }
            selectedCount={
              selectedProjectIds.length
            }
            draftSurveys={
              summary.draft_surveys
            }
            publishedSurveys={
              summary.published_surveys
            }
            archivedSurveys={
              archivedSurveys
            }
            loading={loading}
            connected={connected}
          />
        }
        statusBar={
          <SurveyStatusBar
            projectCount={
              filteredProjects.length
            }
            selectedCount={
              selectedProjectIds.length
            }
            loading={loading}
            connected={connected}
          />
        }
      />

      <EEUIDialog
        open={createDialogOpen}
        title="Create Survey Project"
        subtitle="Configure the initial identity, ownership, coverage, schedule, and publication status."
        icon={FilePlus2}
        size="large"
        closeOnBackdrop={!submitting}
        closeOnEscape={!submitting}
        showCloseButton
        onClose={handleCloseCreateDialog}
      >
        <SurveyProjectForm
          coverageLevels={[]}
          organizations={[]}
          submitting={submitting}
          onSubmit={
            handleSubmitCreateSurvey
          }
          onCancel={
            handleCloseCreateDialog
          }
        />
      </EEUIDialog>
    </>
  );
}