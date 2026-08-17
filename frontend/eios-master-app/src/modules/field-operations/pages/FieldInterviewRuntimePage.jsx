import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import MainLayout from "../../../layouts/MainLayout";
import { createUuid } from "../../../utils/createUuid";
import { captureDeviceLocation } from "../../../utils/captureDeviceLocation";
import {
  createOfflineResponse,
} from "../../../services/offlineResponseService";
import useSurveyDeploymentRuntime from "../../survey-engine/runtime/useSurveyDeploymentRuntime";

import {
  runQuestionLogicRuntime,
} from "../../survey-engine/runtime/logicRuntime";
import { PreviewQuestion } from "../../survey-preview/components";
import { isAnswerEmpty } from "../../survey-engine/runtime/questionTypeRegistry";
import "../../survey-preview/styles/preview.css";

export default function FieldInterviewRuntimePage() {
  const {
    deploymentId,
  } = useParams();

  const {
    deployment,
    deploymentPackage,
    questions,
    logicRules,
    loading,
    error,
    loadDeployment,
  } = useSurveyDeploymentRuntime();

  const [
    answersByQuestionId,
    setAnswersByQuestionId,
  ] = useState({});

  const [
    savingInterview,
    setSavingInterview,
  ] = useState(false);

  const [
    saveMessage,
    setSaveMessage,
  ] = useState("");

  const [
    saveError,
    setSaveError,
  ] = useState("");

  useEffect(() => {
    if (!deploymentId) {
      return;
    }

    loadDeployment(
      deploymentId
    ).catch(() => {});
  }, [
    deploymentId,
    loadDeployment,
  ]);

  const logicRuntimeResult =
    useMemo(() => {
      return runQuestionLogicRuntime(
        logicRules,
        answersByQuestionId
      );
    }, [
      logicRules,
      answersByQuestionId,
    ]);

  const conditionalShowQuestionIds =
    useMemo(() => {
      const ids = new Set();

      logicRules.forEach(
        (logicRule) => {
          const actionType =
            String(
              logicRule
                ?.action_json
                ?.type || ""
            )
              .trim()
              .toUpperCase();

          if (
            actionType !== "SHOW"
          ) {
            return;
          }

          const affectedIds =
            Array.isArray(
              logicRule
                ?.affected_questions_json
            )
              ? logicRule
                  .affected_questions_json
              : [];

          affectedIds.forEach(
            (questionId) => {
              if (questionId) {
                ids.add(questionId);
              }
            }
          );
        }
      );

      return [
        ...ids,
      ];
    }, [logicRules]);

  async function saveInterview() {
    try {
      setSavingInterview(true);
      setSaveMessage("");
      setSaveError("");

      const enumeratorId =
        deployment?.enumerator_id;

      const operationalDeploymentId =
        deployment
          ?.operational_deployment_id;

      const surveyVersionId =
        deployment?.survey_version_id;

      if (
        !enumeratorId ||
        !operationalDeploymentId ||
        !surveyVersionId
      ) {
        throw new Error(
          "The interview identity context is incomplete."
        );
      }

      const requiredQuestionIds =
        new Set(
          logicRuntimeResult
            ?.execution_state
            ?.require_question_ids ||
            []
        );

      questions.forEach(
        (question) => {
          if (
            question.required_override ||
            question.required_flag
          ) {
            requiredQuestionIds.add(
              question.question_id
            );
          }
        }
      );

      const missingRequired =
        questions.filter(
          (question) => {
            const questionId =
              question.question_id;

            const explicitlyHidden =
              logicRuntimeResult
                ?.execution_state
                ?.hide_question_ids
                ?.includes(
                  questionId
                );

            const conditionallyShown =
              conditionalShowQuestionIds
                .includes(
                  questionId
                );

            const currentlyShown =
              logicRuntimeResult
                ?.execution_state
                ?.show_question_ids
                ?.includes(
                  questionId
                );

            const hidden =
              explicitlyHidden ||
              (
                conditionallyShown &&
                !currentlyShown
              );

            if (hidden) {
              return false;
            }

            if (
              !requiredQuestionIds.has(
                questionId
              )
            ) {
              return false;
            }

            const value =
              answersByQuestionId[
                questionId
              ];

            return isAnswerEmpty(value);
          }
        );

      if (
        missingRequired.length > 0
      ) {
        throw new Error(
          `Please complete all required questions. Missing: ${missingRequired
            .map(
              (question) =>
                question.question_code
            )
            .join(", ")}`
        );
      }

      const localResponseId =
        `LOCAL-${createUuid()}`;

      const respondentCode =
        `RESP-${Date.now()}`;

      const interviewLocation =
        await captureDeviceLocation();

      const payload = {
        local_response_id:
          localResponseId,

        local_device_id: null,

        enumerator_id:
          enumeratorId,

        deployment_id:
          operationalDeploymentId,

        survey_version_id:
          surveyVersionId,

        respondent_code:
          respondentCode,

        answers_json:
          answersByQuestionId,

        gps_json: interviewLocation,

        qc_precheck_json: {
          logic_runtime:
            logicRuntimeResult,

          saved_from:
            "FieldInterviewRuntimePage",

          package_deployment_id:
            deployment?.deployment_id,

          package_version:
            deploymentPackage?.version,
        },
      };

      const result =
        await createOfflineResponse(
          payload
        );

      setSaveMessage(
        result?.message ||
          "Interview saved successfully."
      );
    } catch (saveException) {
      console.error(
        "Interview save failed:",
        saveException
      );

      setSaveError(
        saveException?.message ||
          "Unable to save the interview."
      );
    } finally {
      setSavingInterview(false);
    }
  }

  function handleAnswerChange(
    questionId,
    value
  ) {
    setAnswersByQuestionId(
      (currentAnswers) => ({
        ...currentAnswers,
        [questionId]: value,
      })
    );
  }

  if (loading) {
    return (
      <MainLayout>
        <section>
          <h1>Field Interview Runtime</h1>

          <p>
            Loading deployment package...
          </p>
        </section>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <section>
          <h1>Field Interview Runtime</h1>

          <p>
            {error}
          </p>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          paddingBottom: "40px",
        }}
      >
        <div
          style={{
            marginBottom: "24px",
          }}
        >
          <span className="dashboard-overline">
            Field Operations
          </span>

          <h1>
            Field Interview Runtime
          </h1>

          <p>
            Deployment:{" "}
            {deployment?.deployment_id ||
              "Not loaded"}
          </p>

          <p>
            Survey Version:{" "}
            {deploymentPackage?.version ||
              "—"}
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gap: "18px",
          }}
        >
          {questions.map(
            (question) => {
              const questionId =
                question.question_id;

              const explicitlyHidden =
                logicRuntimeResult
                  ?.execution_state
                  ?.hide_question_ids
                  ?.includes(
                    questionId
                  );

              const conditionallyShown =
                conditionalShowQuestionIds
                  .includes(
                    questionId
                  );

              const currentlyShown =
                logicRuntimeResult
                  ?.execution_state
                  ?.show_question_ids
                  ?.includes(
                    questionId
                  );

              const hidden =
                explicitlyHidden ||
                (
                  conditionallyShown &&
                  !currentlyShown
                );

              if (hidden) {
                return null;
              }

              const requiredByLogic =
                logicRuntimeResult
                  ?.execution_state
                  ?.require_question_ids
                  ?.includes(
                    questionId
                  );

              const required =
                Boolean(
                  requiredByLogic ||
                    question.required_override ||
                    question.required_flag
                );

              return (
                  <PreviewQuestion
                    key={questionId}
                    question={{
                      ...question,
                      required,
                    }}
                    value={
                      answersByQuestionId[
                        questionId
                      ]
                    }
                    onChange={(value) =>
                      handleAnswerChange(
                        questionId,
                        value
                      )
                    }
                    questionNumber={
                      questions.indexOf(question) + 1
                    }
                  />
              );
            }
          )}
        </div>

        {saveError && (
          <div
            style={{
              marginTop: "22px",
              padding: "14px 16px",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {saveError}
          </div>
        )}

        {saveMessage && (
          <div
            style={{
              marginTop: "22px",
              padding: "14px 16px",
              border: "1px solid #bbf7d0",
              borderRadius: "12px",
              background: "#f0fdf4",
              color: "#166534",
            }}
          >
            {saveMessage}
          </div>
        )}

        <button
          type="button"
          onClick={saveInterview}
          disabled={savingInterview}
          style={{
            width: "100%",
            minHeight: "58px",
            marginTop: "22px",
            border: 0,
            borderRadius: "14px",
            fontSize: "17px",
            fontWeight: 700,
            background: savingInterview
              ? "#cbd5e1"
              : "#2563eb",
            color: savingInterview
              ? "#475569"
              : "#ffffff",
            cursor: savingInterview
              ? "not-allowed"
              : "pointer",
          }}
        >
          {savingInterview
            ? "Saving Interview..."
            : "Save Interview"}
        </button>

      </section>
    </MainLayout>
  );
}
