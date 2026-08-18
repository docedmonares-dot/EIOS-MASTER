import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  compileSurveyPreview,
} from "../../../../services/metadataCompilerService";

import {
  addEnterpriseQuestionToSurvey,
  createQuestionnaireSection,
  createSurveyLocalQuestion,
  deleteQuestionnaireItem,
  getQuestionnaireDesignerWorkspace,
  updateQuestionnaireItem,
  updateQuestionnaireSection,
} from "../../../../services/questionnaireDesignerService";

const initialSectionForm = {
  section_title: "",
  section_code: "",
  section_description: "",
  section_type: "Standard",
};

const initialQuestionForm = {
  question_type_id: "",
  question_text: "",
  variable_name: "",
  help_text: "",
  placeholder_text: "",
  required_flag: false,
};

const initialWorkspace = {
  survey: null,
  sections: [],
  questionnaire_items: [],
  question_types: [],
  question_bank: [],
  designer_state: null,
};

export default function useQuestionnaireDesigner(
  surveyId
) {
  const [workspace, setWorkspace] =
    useState(initialWorkspace);

  const [
    selectedSectionId,
    setSelectedSectionId,
  ] = useState("");

  const [
    selectedItemId,
    setSelectedItemId,
  ] = useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [connected, setConnected] =
    useState(true);

  const [
    isSectionModalOpen,
    setIsSectionModalOpen,
  ] = useState(false);

  const [
    isQuestionModalOpen,
    setIsQuestionModalOpen,
  ] = useState(false);

  const [
    sectionForm,
    setSectionForm,
  ] = useState(initialSectionForm);

  const [
    questionForm,
    setQuestionForm,
  ] = useState(initialQuestionForm);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    inspectorErrorMessage,
    setInspectorErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    activeRibbonTab,
    setActiveRibbonTab,
  ] = useState("Home");

  const [
    activeLibraryTab,
    setActiveLibraryTab,
  ] = useState("Questions");

  const [
    toolboxExpanded,
    setToolboxExpanded,
  ] = useState(true);

  const [
    librarySearch,
    setLibrarySearch,
  ] = useState("");

  /* =========================================================
     METADATA COMPILER STATE
  ========================================================= */

  const [
    compilerOpen,
    setCompilerOpen,
  ] = useState(false);

  const [
    compiling,
    setCompiling,
  ] = useState(false);

  const [
    compilerResult,
    setCompilerResult,
  ] = useState(null);

  const [
    compilerErrorMessage,
    setCompilerErrorMessage,
  ] = useState("");

  const [
    compilerDurationMs,
    setCompilerDurationMs,
  ] = useState(null);

  /* =========================================================
     LOAD DESIGNER WORKSPACE
  ========================================================= */

  const loadWorkspace = useCallback(
    async ({
      preserveSelection = true,
    } = {}) => {
      try {
        setLoading(true);
        setConnected(true);
        setErrorMessage("");

        const data =
          await getQuestionnaireDesignerWorkspace(
            surveyId
          );

        const nextWorkspace = {
          survey: data?.survey || null,
          sections: data?.sections || [],
          questionnaire_items:
            data?.questionnaire_items || [],
          question_types:
            data?.question_types || [],
          question_bank:
            data?.question_bank || [],
          designer_state:
            data?.designer_state || null,
        };

        setWorkspace(nextWorkspace);

        setSelectedSectionId(
          (currentSectionId) => {
            if (
              preserveSelection &&
              currentSectionId
            ) {
              const sectionStillExists =
                nextWorkspace.sections.some(
                  (section) =>
                    section.section_id ===
                    currentSectionId
                );

              if (sectionStillExists) {
                return currentSectionId;
              }
            }

            return (
              nextWorkspace.designer_state
                ?.selected_section_id ||
              nextWorkspace.sections[0]
                ?.section_id ||
              ""
            );
          }
        );

        setSelectedItemId(
          (currentItemId) => {
            if (
              preserveSelection &&
              currentItemId
            ) {
              const itemStillExists =
                nextWorkspace
                  .questionnaire_items
                  .some(
                    (item) =>
                      item.questionnaire_item_id ===
                      currentItemId
                  );

              if (itemStillExists) {
                return currentItemId;
              }
            }

            return (
              nextWorkspace.designer_state
                ?.selected_item_id ||
              ""
            );
          }
        );
      } catch (error) {
        console.error(
          "Questionnaire Designer loading failed:",
          error
        );

        setConnected(false);

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load the questionnaire designer."
        );
      } finally {
        setLoading(false);
      }
    },
    [surveyId]
  );

  useEffect(() => {
    loadWorkspace({
      preserveSelection: false,
    });
  }, [loadWorkspace]);

  /* =========================================================
     DERIVED DESIGNER STATE
  ========================================================= */

  const selectedSection = useMemo(
    () =>
      workspace.sections.find(
        (section) =>
          section.section_id ===
          selectedSectionId
      ) || null,
    [
      workspace.sections,
      selectedSectionId,
    ]
  );

  const selectedItem = useMemo(
    () =>
      workspace.questionnaire_items.find(
        (item) =>
          item.questionnaire_item_id ===
          selectedItemId
      ) || null,
    [
      workspace.questionnaire_items,
      selectedItemId,
    ]
  );

  const visibleItems = useMemo(
    () =>
      workspace.questionnaire_items.filter(
        (item) => {
          if (!selectedSectionId) {
            return !item.section_id;
          }

          return (
            item.section_id ===
            selectedSectionId
          );
        }
      ),
    [
      workspace.questionnaire_items,
      selectedSectionId,
    ]
  );

  const groupedQuestionTypes =
    useMemo(() => {
      return workspace.question_types.reduce(
        (groups, questionType) => {
          const category =
            questionType.category_group ||
            "General";

          if (!groups[category]) {
            groups[category] = [];
          }

          groups[category].push(
            questionType
          );

          return groups;
        },
        {}
      );
    }, [workspace.question_types]);

  const filteredQuestionBank =
    useMemo(() => {
      const searchTerm =
        librarySearch
          .trim()
          .toLowerCase();

      if (!searchTerm) {
        return workspace.question_bank;
      }

      return workspace.question_bank.filter(
        (question) =>
          question.question_text
            ?.toLowerCase()
            .includes(searchTerm) ||
          question.question_code
            ?.toLowerCase()
            .includes(searchTerm) ||
          question.category_name
            ?.toLowerCase()
            .includes(searchTerm)
      );
    }, [
      workspace.question_bank,
      librarySearch,
    ]);

  /* =========================================================
     GENERAL UI HELPERS
  ========================================================= */

  function clearMessages() {
    setErrorMessage("");
    setInspectorErrorMessage("");
    setSuccessMessage("");
  }

  function openSectionModal() {
    setSectionForm(initialSectionForm);
    clearMessages();
    setIsSectionModalOpen(true);
  }

  function openQuestionModal(
    questionType = null
  ) {
    setQuestionForm({
      ...initialQuestionForm,
      question_type_id:
        questionType
          ?.question_type_id || "",
    });

    clearMessages();
    setIsQuestionModalOpen(true);
  }

  function closeModals() {
    if (saving) {
      return;
    }

    setIsSectionModalOpen(false);
    setIsQuestionModalOpen(false);
  }

  function handleSectionInputChange(
    event
  ) {
    const { name, value } =
      event.target;

    setSectionForm(
      (currentForm) => ({
        ...currentForm,
        [name]: value,
      })
    );
  }

  function handleQuestionInputChange(
    event
  ) {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setQuestionForm(
      (currentForm) => ({
        ...currentForm,
        [name]:
          type === "checkbox"
            ? checked
            : value,
      })
    );
  }

  /* =========================================================
     CREATE SECTION
  ========================================================= */

  async function createSection(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      clearMessages();

      const createdSection =
        await createQuestionnaireSection(
          surveyId,
          sectionForm
        );

      setSelectedSectionId(
        createdSection.section_id
      );

      setSuccessMessage(
        `${createdSection.section_title} was created successfully.`
      );

      setIsSectionModalOpen(false);

      await loadWorkspace();
    } catch (error) {
      console.error(
        "Questionnaire section creation failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to create the questionnaire section."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     CREATE SURVEY-LOCAL QUESTION
  ========================================================= */

  async function createQuestion(
    event
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      clearMessages();

      const createdQuestion =
        await createSurveyLocalQuestion(
          surveyId,
          {
            ...questionForm,
            section_id:
              selectedSectionId ||
              null,
          }
        );

      const createdItemId =
        createdQuestion?.item
          ?.questionnaire_item_id ||
        "";

      setSelectedItemId(
        createdItemId
      );

      setSuccessMessage(
        `${
          createdQuestion?.question
            ?.question_text ||
          "Question"
        } was created successfully.`
      );

      setIsQuestionModalOpen(false);

      await loadWorkspace();
    } catch (error) {
      console.error(
        "Survey-local question creation failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to create the survey-local question."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     ADD ENTERPRISE QUESTION
  ========================================================= */

  async function addEnterpriseQuestion(
    question
  ) {
    if (!question?.question_id) {
      return;
    }

    try {
      setSaving(true);
      clearMessages();

      const createdItem =
        await addEnterpriseQuestionToSurvey(
          surveyId,
          {
            question_id:
              question.question_id,
            section_id:
              selectedSectionId ||
              null,
          }
        );

      setSelectedItemId(
        createdItem
          ?.questionnaire_item_id ||
          ""
      );

      setSuccessMessage(
        "Enterprise question added successfully."
      );

      await loadWorkspace();
    } catch (error) {
      console.error(
        "Enterprise question insertion failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to add the enterprise question."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     UPDATE QUESTIONNAIRE ITEM
  ========================================================= */

  async function saveQuestionItem(
    updateData
  ) {
    if (
      !selectedItem
        ?.questionnaire_item_id
    ) {
      return;
    }

    try {
      setSaving(true);
      setInspectorErrorMessage("");
      setSuccessMessage("");

      const selectedId =
        selectedItem
          .questionnaire_item_id;

      await updateQuestionnaireItem(
        surveyId,
        selectedId,
        updateData
      );

      setSuccessMessage(
        "Question saved successfully."
      );

      setSelectedSectionId(
        updateData.section_id || ""
      );

      setSelectedItemId(
        selectedId
      );

      await loadWorkspace();
    } catch (error) {
      console.error(
        "Questionnaire item update failed:",
        error
      );

      setInspectorErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to save the question."
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelQuestionEdit() {
    setInspectorErrorMessage("");
  }

  async function toggleSelectedSection() {
    if (!selectedSection?.section_id) {
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      const currentlyIncluded =
        selectedSection.settings_json?.is_applicable !== false;

      await updateQuestionnaireSection(
        surveyId,
        selectedSection.section_id,
        {
          settings_json: {
            ...selectedSection.settings_json,
            is_applicable: !currentlyIncluded,
          },
        }
      );

      setSuccessMessage(
        currentlyIncluded
          ? "Section marked Not Applicable and excluded from compilation."
          : "Section included in the instrument."
      );
      await loadWorkspace();
    } catch (error) {
      setInspectorErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to change section applicability."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteQuestionItem(itemId) {
    if (!itemId) {
      return;
    }

    try {
      setSaving(true);
      setSuccessMessage("");
      setInspectorErrorMessage("");
      await deleteQuestionnaireItem(surveyId, itemId);
      setSelectedItemId("");
      setSuccessMessage("Question deleted from the draft instrument.");
      await loadWorkspace();
    } catch (error) {
      setInspectorErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete the question."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =========================================================
     METADATA COMPILER
  ========================================================= */

  async function compileDraft() {
    const startedAt =
      performance.now();

    try {
      setCompilerOpen(true);
      setCompiling(true);
      setCompilerResult(null);
      setCompilerErrorMessage("");
      setCompilerDurationMs(null);

      const result =
        await compileSurveyPreview(
          surveyId
        );

      setCompilerResult(result);

      setCompilerDurationMs(
        Math.round(
          performance.now() -
            startedAt
        )
      );
    } catch (error) {
      console.error(
        "Metadata compilation failed:",
        error
      );

      setCompilerErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to compile the instrument."
      );

      setCompilerDurationMs(
        Math.round(
          performance.now() -
            startedAt
        )
      );
    } finally {
      setCompiling(false);
    }
  }

  function closeCompilerConsole() {
    if (compiling) {
      return;
    }

    setCompilerOpen(false);
  }

  /* =========================================================
     PLACEHOLDER COMMANDS
  ========================================================= */

  function saveDraft() {
    setSuccessMessage(
      "All current questionnaire changes are stored in the draft workspace."
    );
  }

  function validateDraft() {
    compileDraft();
  }

  /* =========================================================
     PUBLIC HOOK CONTRACT
  ========================================================= */

  return {
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
    addEnterpriseQuestion,
    saveQuestionItem,
    cancelQuestionEdit,
    toggleSelectedSection,
    deleteQuestionItem,

    compilerOpen,
    compiling,
    compilerResult,
    compilerErrorMessage,
    compilerDurationMs,

    compileDraft,
    closeCompilerConsole,

    saveDraft,
    validateDraft,

    reload: loadWorkspace,
  };
}
