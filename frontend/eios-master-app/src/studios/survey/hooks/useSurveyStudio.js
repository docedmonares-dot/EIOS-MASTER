import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getSurveyStudioData,
} from "../services";

const initialSummary = {
  total_surveys: 0,
  draft_surveys: 0,
  published_surveys: 0,
  field_operation_surveys: 0,
  closed_surveys: 0,
  active_coverage_levels: 0,
  executive_integration: "Checking",
};

export default function useSurveyStudio() {
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] =
    useState(initialSummary);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [
    selectedProjectIds,
    setSelectedProjectIds,
  ] = useState([]);

  const [loading, setLoading] =
    useState(true);

   const [
  createDialogOpen,
  setCreateDialogOpen,
] = useState(false);

const [
  submitting,
  setSubmitting,
] = useState(false); 

  const [connected, setConnected] =
    useState(true);

  const [errorMessage, setErrorMessage] =
    useState("");

  const loadSurveyStudio = useCallback(
    async () => {
      try {
        setLoading(true);
        setConnected(true);
        setErrorMessage("");

        const data =
          await getSurveyStudioData(100);

        setProjects(data.projects || []);
        setSummary(
          data.summary || initialSummary
        );
      } catch (error) {
        console.error(
          "SURVEY STUDIO LOAD ERROR:",
          error
        );

        setConnected(false);

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load Survey Studio data."
        );

        setProjects([]);
        setSummary(initialSummary);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadSurveyStudio();
  }, [loadSurveyStudio]);

  const filteredProjects = useMemo(() => {
    const normalizedSearchTerm =
      searchTerm.trim().toLowerCase();

    if (!normalizedSearchTerm) {
      return projects;
    }

    return projects.filter((project) => {
      const searchableValues = [
        project.code,
        project.name,
        project.description,
        project.purpose,
        project.coverage,
        project.organization,
        project.status,
        project.version,
      ];

      return searchableValues.some((value) =>
        String(value || "")
          .toLowerCase()
          .includes(normalizedSearchTerm)
      );
    });
  }, [projects, searchTerm]);

  const archivedSurveys = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status === "Archived"
      ).length,
    [projects]
  );

  return {
    projects,
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

    reload: loadSurveyStudio,

  };
}