import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  createEnterpriseQuestion,
  deleteEnterpriseQuestion,
  getEnterpriseQuestionById,
  getEnterpriseQuestions,
  updateEnterpriseQuestion,
} from "../../../services/enterpriseQuestionBankService";

export default function useEnterpriseQuestionBank({
  autoLoad = true,
} = {}) {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");
  const [lastLoadedAt, setLastLoadedAt] =
    useState(null);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const normalizeErrorMessage = useCallback(
    (requestError, fallbackMessage) => {
      return (
        requestError?.response?.data?.message ||
        requestError?.response?.data?.error ||
        requestError?.message ||
        fallbackMessage
      );
    },
    []
  );

  const loadQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getEnterpriseQuestions();

      const normalizedQuestions = Array.isArray(data)
        ? data
        : [];

      setQuestions(normalizedQuestions);
      setLastLoadedAt(new Date());

      return normalizedQuestions;
    } catch (requestError) {
      const message = normalizeErrorMessage(
        requestError,
        "Unable to load the Enterprise Question Bank."
      );

      setError(message);

      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [normalizeErrorMessage]);

  const loadQuestionById = useCallback(
    async (questionId) => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getEnterpriseQuestionById(
            questionId
          );

        setSelectedQuestion(data);

        return data;
      } catch (requestError) {
        const message = normalizeErrorMessage(
          requestError,
          "Unable to load the selected Enterprise Question."
        );

        setError(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [normalizeErrorMessage]
  );

  const selectQuestion = useCallback(
    async (questionOrId) => {
      if (!questionOrId) {
        setSelectedQuestion(null);
        return null;
      }

      if (
        typeof questionOrId === "object" &&
        questionOrId.question_id
      ) {
        return loadQuestionById(
          questionOrId.question_id
        );
      }

      return loadQuestionById(questionOrId);
    },
    [loadQuestionById]
  );

  const createQuestion = useCallback(
    async (questionData) => {
      try {
        setSaving(true);
        setError("");

        const createdQuestion =
          await createEnterpriseQuestion(
            questionData
          );

        setQuestions((currentQuestions) => {
          return [
            ...currentQuestions,
            createdQuestion,
          ].sort((firstQuestion, secondQuestion) => {
            return String(
              firstQuestion?.question_code || ""
            ).localeCompare(
              String(
                secondQuestion?.question_code || ""
              )
            );
          });
        });

        setSelectedQuestion(createdQuestion);

        return createdQuestion;
      } catch (requestError) {
        const message = normalizeErrorMessage(
          requestError,
          "Unable to create the Enterprise Question."
        );

        setError(message);

        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [normalizeErrorMessage]
  );

  const updateQuestion = useCallback(
    async (
      questionId,
      questionData
    ) => {
      try {
        setSaving(true);
        setError("");

        const updatedQuestion =
          await updateEnterpriseQuestion(
            questionId,
            questionData
          );

        setQuestions((currentQuestions) => {
          return currentQuestions
            .map((question) => {
              return question.question_id ===
                updatedQuestion.question_id
                ? {
                    ...question,
                    ...updatedQuestion,
                  }
                : question;
            })
            .sort(
              (
                firstQuestion,
                secondQuestion
              ) => {
                return String(
                  firstQuestion?.question_code ||
                    ""
                ).localeCompare(
                  String(
                    secondQuestion
                      ?.question_code || ""
                  )
                );
              }
            );
        });

        setSelectedQuestion(
          updatedQuestion
        );

        return updatedQuestion;
      } catch (requestError) {
        const message = normalizeErrorMessage(
          requestError,
          "Unable to update the Enterprise Question."
        );

        setError(message);

        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [normalizeErrorMessage]
  );

  const removeQuestion = useCallback(
    async (questionId) => {
      try {
        setDeleting(true);
        setError("");

        const deletedQuestion =
          await deleteEnterpriseQuestion(
            questionId
          );

        setQuestions((currentQuestions) => {
          return currentQuestions.filter(
            (question) =>
              question.question_id !==
              questionId
          );
        });

        setSelectedQuestion(
          (currentSelectedQuestion) => {
            if (
              currentSelectedQuestion
                ?.question_id === questionId
            ) {
              return null;
            }

            return currentSelectedQuestion;
          }
        );

        return deletedQuestion;
      } catch (requestError) {
        const message = normalizeErrorMessage(
          requestError,
          "Unable to delete the Enterprise Question."
        );

        setError(message);

        throw requestError;
      } finally {
        setDeleting(false);
      }
    },
    [normalizeErrorMessage]
  );

  const refresh = useCallback(async () => {
    return loadQuestions();
  }, [loadQuestions]);

  const clearSelection = useCallback(() => {
    setSelectedQuestion(null);
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    loadQuestions().catch(() => {
      /*
       * The error state is already handled by the hook.
       * This prevents an unhandled Promise rejection
       * during automatic initial loading.
       */
    });
  }, [
    autoLoad,
    loadQuestions,
  ]);

  return {
    questions,
    selectedQuestion,

    loading,
    saving,
    deleting,

    error,
    lastLoadedAt,

    loadQuestions,
    loadQuestionById,
    selectQuestion,

    createQuestion,
    updateQuestion,
    removeQuestion,

    refresh,
    clearSelection,
    clearError,
  };
}