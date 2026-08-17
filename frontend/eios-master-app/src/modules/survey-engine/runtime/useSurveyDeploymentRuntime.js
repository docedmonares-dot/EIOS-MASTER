import {
  useCallback,
  useState,
} from "react";

import {
  getSurveyDeploymentById,
} from "../../../services/surveyDeploymentService";

export default function useSurveyDeploymentRuntime() {
  const [deployment, setDeployment] =
    useState(null);

  const [deploymentPackage, setDeploymentPackage] =
    useState(null);

  const [questions, setQuestions] =
    useState([]);

  const [logicRules, setLogicRules] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadDeployment = useCallback(
    async (deploymentId) => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getSurveyDeploymentById(
            deploymentId
          );

        const packageData =
          data?.deployment_package || null;

        const rawQuestionSnapshot =
          Array.isArray(
            packageData?.question_snapshot
          )
            ? packageData.question_snapshot
            : [];

        const questionSnapshot = rawQuestionSnapshot.map(
          (question) => ({
            ...question,
            question_id:
              question.question_id ??
              question.questionnaire_item_id,
            question_type:
              question.question_type ??
              (question.type_code
                ? {
                    type_code: question.type_code,
                    type_name: question.type_name,
                    response_data_type:
                      question.response_data_type,
                    renderer_component:
                      question.renderer_component,
                    preview_component:
                      question.preview_component,
                  }
                : null),
          })
        );

        const logicSnapshot =
          Array.isArray(
            packageData?.logic_snapshot
          )
            ? packageData.logic_snapshot
            : [];

        setDeployment(data);
        setDeploymentPackage(packageData);
        setQuestions(questionSnapshot);
        setLogicRules(logicSnapshot);

        return {
          deployment: data,
          deploymentPackage:
            packageData,
          questions:
            questionSnapshot,
          logicRules:
            logicSnapshot,
        };
      } catch (requestError) {
        const message =
          requestError?.message ||
          "Unable to load survey deployment.";

        setError(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearDeployment =
    useCallback(() => {
      setDeployment(null);
      setDeploymentPackage(null);
      setQuestions([]);
      setLogicRules([]);
      setError("");
    }, []);

  return {
    deployment,
    deploymentPackage,
    questions,
    logicRules,

    loading,
    error,

    loadDeployment,
    clearDeployment,
  };
}
