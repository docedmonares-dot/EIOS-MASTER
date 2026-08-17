import {
  ChevronLeft,
  Eye,
  GripVertical,
  LoaderCircle,
  PanelBottomClose,
  PanelBottomOpen,
  Rocket,
  Save,
  TerminalSquare,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import {
  assignPackageToEnumerator,
  deployLatestSurveyVersion,
  getActiveEnumerators,
  publishSurveyVersion,
} from "../../../services/questionnaireDesignerService";

import {
  CompilerConsole,
  EnterpriseQuestionInspector,
} from "../../../eeui";

import {
  DesignerCanvas,
  DesignerExplorer,
  DesignerLibrary,
  DesignerRibbon,
  DesignerStatusBar,
  LocalQuestionModal,
  SectionModal,
  useQuestionnaireDesigner,
} from "../designer";

export default function QuestionnaireDesignerPage() {
  const { surveyId } = useParams();
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployStudioOpen, setDeployStudioOpen] = useState(false);
  const [enumerators, setEnumerators] = useState([]);
  const [selectedEnumeratorId, setSelectedEnumeratorId] = useState("");

  const {
    workspace,

    selectedSectionId,
    setSelectedSectionId,

    selectedItemId,
    setSelectedItemId,

    selectedSection,
    selectedItem,
    visibleItems,

    groupedQuestionTypes,
    filteredQuestionBank,

    loading,
    saving,
    connected,

    errorMessage,
    inspectorErrorMessage,
    successMessage,

    activeRibbonTab,
    setActiveRibbonTab,

    activeLibraryTab,
    setActiveLibraryTab,

    toolboxExpanded,
    setToolboxExpanded,

    librarySearch,
    setLibrarySearch,

    isSectionModalOpen,
    isQuestionModalOpen,

    sectionForm,
    questionForm,

    openSectionModal,
    openQuestionModal,
    closeModals,

    handleSectionInputChange,
    handleQuestionInputChange,

    createSection,
    createQuestion,
    quickCreateQuestion,
    addEnterpriseQuestion,
    saveQuestionItem,
    cancelQuestionEdit,

    compilerOpen,
    compiling,
    compilerResult,
    compilerErrorMessage,
    compilerDurationMs,

    compileDraft,
    closeCompilerConsole,

    saveDraft,
    validateDraft,
  } = useQuestionnaireDesigner(surveyId);

function handlePreview() {
  navigate(
    `/survey-builder/${surveyId}/preview`
  );
}

  function handlePublish() {
    setActiveRibbonTab("Publish");
  }

  async function publishCurrentVersion() {
    try {
      setPublishing(true);
      const result = await publishSurveyVersion(surveyId);
      window.alert(
        `${result.message} Version ${result.version?.version_number ?? "created"}.`
      );
    } catch (publishError) {
      window.alert(
        publishError.response?.data?.error ||
          publishError.response?.data?.message ||
          publishError.message ||
          "Unable to publish the survey."
      );
    } finally {
      setPublishing(false);
    }
  }

  async function openDeployStudio() {
    try {
      setDeploying(true);
      const availableEnumerators = await getActiveEnumerators();
      setEnumerators(availableEnumerators);
      setSelectedEnumeratorId(
        availableEnumerators[0]?.personnel_id || ""
      );
      setDeployStudioOpen(true);
    } catch (deployError) {
      window.alert(deployError.message || "Unable to load Enumerators.");
    } finally {
      setDeploying(false);
    }
  }

  async function deployCurrentVersion() {
    try {
      setDeploying(true);
      const packageResult = await deployLatestSurveyVersion(surveyId);
      const packageId = packageResult.data?.deployment_id;
      const result = await assignPackageToEnumerator(
        packageId,
        selectedEnumeratorId
      );
      setDeployStudioOpen(false);
      window.alert(
        `${result.message} ${result.data?.personnel_name ?? "Enumerator"}.`
      );
    } catch (deployError) {
      window.alert(
        deployError.response?.data?.message ||
          deployError.response?.data?.error ||
          deployError.message ||
          "Unable to deploy the survey."
      );
    } finally {
      setDeploying(false);
    }
  }

  return (
    <MainLayout>
      <section className="survey-studio">
        <header className="survey-studio-titlebar">
          <div className="survey-studio-titlebar__identity">
            <button
              type="button"
              onClick={() =>
                navigate("/survey-builder")
              }
              className="survey-studio-back"
            >
              <ChevronLeft size={17} />
              Survey Engine
            </button>

            <div>
              <span>
                Book III · Visual Questionnaire Studio
              </span>

              <h1>
                {workspace.survey?.survey_name ||
                  "Questionnaire Designer"}
              </h1>

              <p>
                {workspace.survey?.survey_code ||
                  "Loading survey project..."}
              </p>
            </div>
          </div>

          <div className="survey-studio-titlebar__actions">
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
            >
              <Save size={17} />
              {saving ? "Saving..." : "Save"}
            </button>

            <button
              type="button"
              onClick={handlePreview}
              disabled={loading}
            >
              <Eye size={17} />
              Preview
            </button>

            <button
              type="button"
              onClick={compileDraft}
              disabled={
                loading ||
                saving ||
                compiling
              }
            >
              <TerminalSquare size={17} />

              {compiling
                ? "Compiling..."
                : "Compile"}
            </button>

            <button
              type="button"
              className="survey-studio-primary-action"
              onClick={handlePublish}
              disabled={
                loading ||
                saving ||
                compiling
              }
            >
              <Rocket size={17} />
              Publish
            </button>
          </div>
        </header>

        <DesignerRibbon
          activeTab={activeRibbonTab}
          saving={saving || compiling || publishing || deploying}
          onTabChange={setActiveRibbonTab}
          onAddSection={openSectionModal}
          onAddQuestion={() =>
            openQuestionModal()
          }
          onSaveDraft={saveDraft}
          onValidate={validateDraft}
          onPublish={publishCurrentVersion}
          onDeploy={openDeployStudio}
        />

        {errorMessage && (
          <div className="enterprise-foundation-state enterprise-foundation-state--error">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="survey-engine-message survey-engine-message--success">
            {successMessage}
          </div>
        )}

        {!loading && (
          <section
            className={
              toolboxExpanded
                ? "survey-studio-toolbox survey-studio-toolbox--expanded"
                : "survey-studio-toolbox"
            }
          >
            <div className="survey-studio-toolbox__header">
              <div>
                <span>
                  Dynamic Question Toolbox
                </span>

                <strong>
                  {workspace.question_types.length}{" "}
                  active types
                </strong>
              </div>

              <button
                type="button"
                onClick={() =>
                  setToolboxExpanded(
                    (currentValue) =>
                      !currentValue
                  )
                }
              >
                {toolboxExpanded ? (
                  <PanelBottomClose size={18} />
                ) : (
                  <PanelBottomOpen size={18} />
                )}

                {toolboxExpanded
                  ? "Collapse"
                  : "Expand"}
              </button>
            </div>

            {toolboxExpanded && (
              <div className="survey-studio-toolbox__groups">
                {Object.entries(
                  groupedQuestionTypes
                ).map(
                  ([
                    category,
                    questionTypes,
                  ]) => (
                    <section key={category}>
                      <h3>{category}</h3>

                      <div>
                        {questionTypes.map(
                          (questionType) => (
                            <button
                              key={
                                questionType.question_type_id
                              }
                              type="button"
                              onClick={() =>
                                openQuestionModal(
                                  questionType
                                )
                              }
                              disabled={
                                saving ||
                                compiling
                              }
                            >
                              <GripVertical
                                size={14}
                              />

                              <span>
                                {
                                  questionType.type_name
                                }
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </section>
                  )
                )}
              </div>
            )}
          </section>
        )}

        {loading ? (
          <div className="questionnaire-designer-loading">
            <LoaderCircle size={26} />
            Loading designer workspace...
          </div>
        ) : (
          <div className="survey-studio-workspace">
            <DesignerExplorer
              sections={workspace.sections}
              questionnaireItems={
                workspace.questionnaire_items
              }
              selectedSectionId={
                selectedSectionId
              }
              onSelectSection={
                setSelectedSectionId
              }
              onAddSection={openSectionModal}
            />

<DesignerCanvas
  selectedSection={
    selectedSection
  }
  visibleItems={
    visibleItems
  }
  selectedItemId={
    selectedItemId
  }
  saving={
    saving
  }
  onSelectItem={
    setSelectedItemId
  }
  onAddQuestion={() =>
    openQuestionModal()
  }
  onQuickCreateQuestion={
    quickCreateQuestion
  }
   onSaveQuestion={
    saveQuestionItem
  }
/>

            <aside className="survey-studio-inspector">
              <EnterpriseQuestionInspector
                item={selectedItem}
                sections={workspace.sections}
                questionTypes={
                  workspace.question_types
                }
                saving={saving}
                errorMessage={
                  inspectorErrorMessage
                }
                onSave={saveQuestionItem}
                onCancel={
                  cancelQuestionEdit
                }
              />
            </aside>

            <DesignerLibrary
              activeTab={activeLibraryTab}
              searchTerm={librarySearch}
              questions={
                filteredQuestionBank
              }
              saving={
                saving || compiling
              }
              onTabChange={
                setActiveLibraryTab
              }
              onSearchChange={
                setLibrarySearch
              }
              onAddQuestion={
                addEnterpriseQuestion
              }
            />
          </div>
        )}

        {!loading && (
          <DesignerStatusBar
            survey={workspace.survey}
            sectionCount={
              workspace.sections.length
            }
            questionCount={
              workspace
                .questionnaire_items.length
            }
            saving={
              saving || compiling
            }
            connected={connected}
          />
        )}

        <CompilerConsole
          open={compilerOpen}
          compiling={compiling}
          result={compilerResult}
          errorMessage={
            compilerErrorMessage
          }
          durationMs={
            compilerDurationMs
          }
          onClose={
            closeCompilerConsole
          }
        />

        <SectionModal
          open={isSectionModalOpen}
          form={sectionForm}
          saving={
            saving || compiling
          }
          onChange={
            handleSectionInputChange
          }
          onSubmit={createSection}
          onClose={closeModals}
        />

        <LocalQuestionModal
          open={isQuestionModalOpen}
          form={questionForm}
          questionTypes={
            workspace.question_types
          }
          saving={
            saving || compiling
          }
          onChange={
            handleQuestionInputChange
          }
          onSubmit={createQuestion}
          onClose={closeModals}
        />

        {deployStudioOpen && (
          <div className="survey-project-modal">
            <div
              className="survey-project-modal__backdrop"
              onClick={() => setDeployStudioOpen(false)}
            />
            <section className="survey-project-modal__dialog questionnaire-small-dialog">
              <div className="survey-project-modal__header">
                <div>
                  <span>Field Operations</span>
                  <h2>Deploy Survey Package</h2>
                  <p>Select the Enumerator who will receive the latest published version.</p>
                </div>
              </div>
              <div className="survey-project-form">
                <label className="survey-project-form__field survey-project-form__field--wide">
                  <span>Enumerator *</span>
                  <select
                    value={selectedEnumeratorId}
                    onChange={(event) => setSelectedEnumeratorId(event.target.value)}
                    disabled={deploying}
                  >
                    {enumerators.map((enumerator) => (
                      <option
                        key={enumerator.personnel_id}
                        value={enumerator.personnel_id}
                      >
                        {enumerator.full_name} — {enumerator.email || "No email"}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="survey-project-form__actions">
                  <button
                    type="button"
                    className="survey-project-form__cancel"
                    onClick={() => setDeployStudioOpen(false)}
                    disabled={deploying}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="survey-project-form__submit"
                    onClick={deployCurrentVersion}
                    disabled={deploying || !selectedEnumeratorId}
                  >
                    {deploying ? "Deploying..." : "Deploy and Assign"}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )}
      </section>
    </MainLayout>
  );
}
