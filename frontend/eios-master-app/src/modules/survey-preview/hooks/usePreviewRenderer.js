import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCompiledSurveyPreview,
} from "../services/previewService";

export default function usePreviewRenderer(
  surveyId
) {
  const [previewData, setPreviewData] =
    useState(null);

  const [
    activeSectionIndex,
    setActiveSectionIndex,
  ] = useState(0);

  const [loading, setLoading] =
    useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    responses,
    setResponses,
  ] = useState({});

  const loadPreview = useCallback(
    async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const result =
          await getCompiledSurveyPreview(
            surveyId
          );

        setPreviewData(result);
        setActiveSectionIndex(0);
        setResponses({});
      } catch (error) {
        console.error(
          "Survey Preview loading failed:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load the compiled survey preview."
        );
      } finally {
        setLoading(false);
      }
    },
    [surveyId]
  );

  useEffect(() => {
    loadPreview();
  }, [loadPreview]);

  const compiledPackage =
    previewData?.package || null;

  const sections =
    compiledPackage?.sections || [];

  const activeSection =
    sections[activeSectionIndex] || null;

  const form =
    compiledPackage?.form || null;

  const manifest =
    compiledPackage?.manifest || null;

  const validation =
    previewData?.validation ||
    compiledPackage?.validation ||
    null;

  const canGoPrevious =
    activeSectionIndex > 0;

  const canGoNext =
    activeSectionIndex <
    sections.length - 1;

  const progressPercent = useMemo(
    () => {
      if (sections.length === 0) {
        return 0;
      }

      return Math.round(
        ((activeSectionIndex + 1) /
          sections.length) *
          100
      );
    },
    [
      activeSectionIndex,
      sections.length,
    ]
  );

  function updateResponse(
    variableName,
    value
  ) {
    if (!variableName) {
      return;
    }

    setResponses(
      (currentResponses) => ({
        ...currentResponses,
        [variableName]: value,
      })
    );
  }

  function goToSection(index) {
    if (
      index < 0 ||
      index >= sections.length
    ) {
      return;
    }

    setActiveSectionIndex(index);
  }

  function goPrevious() {
    if (!canGoPrevious) {
      return;
    }

    setActiveSectionIndex(
      (currentIndex) =>
        currentIndex - 1
    );
  }

  function goNext() {
    if (!canGoNext) {
      return;
    }

    setActiveSectionIndex(
      (currentIndex) =>
        currentIndex + 1
    );
  }

  return {
    previewData,
    compiledPackage,
    form,
    manifest,
    validation,

    sections,
    activeSection,
    activeSectionIndex,

    responses,

    loading,
    errorMessage,

    canGoPrevious,
    canGoNext,
    progressPercent,

    updateResponse,
    goToSection,
    goPrevious,
    goNext,
    reload: loadPreview,
  };
}