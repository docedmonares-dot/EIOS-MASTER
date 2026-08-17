import {
  useCallback,
  useState,
} from "react";

import {
  createEnterpriseQuestionLogic,
  deleteEnterpriseQuestionLogic,
  getEnterpriseQuestionLogicById,
  getEnterpriseQuestionLogicByQuestionId,
  updateEnterpriseQuestionLogic,
} from "../../../services/enterpriseQuestionLogicService";

export default function useEnterpriseQuestionLogic() {
  const [logicRecords, setLogicRecords] =
    useState([]);

  const [selectedLogic, setSelectedLogic] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

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

  const loadLogicByQuestionId = useCallback(
    async (questionId) => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getEnterpriseQuestionLogicByQuestionId(
            questionId
          );

        const normalizedRecords =
          Array.isArray(data)
            ? data
            : [];

        setLogicRecords(
          normalizedRecords
        );

        return normalizedRecords;
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to load Question Logic."
          );

        setError(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [normalizeErrorMessage]
  );

  const loadLogicById = useCallback(
    async (logicId) => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getEnterpriseQuestionLogicById(
            logicId
          );

        setSelectedLogic(data);

        return data;
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to load the Question Logic record."
          );

        setError(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [normalizeErrorMessage]
  );

  const createLogic = useCallback(
    async (logicData) => {
      try {
        setSaving(true);
        setError("");

        const createdLogic =
          await createEnterpriseQuestionLogic(
            logicData
          );

        setLogicRecords(
          (currentRecords) => [
            ...currentRecords,
            createdLogic,
          ]
        );

        setSelectedLogic(
          createdLogic
        );

        return createdLogic;
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to create Question Logic."
          );

        setError(message);

        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [normalizeErrorMessage]
  );

  const updateLogic = useCallback(
    async (
      logicId,
      logicData
    ) => {
      try {
        setSaving(true);
        setError("");

        const updatedLogic =
          await updateEnterpriseQuestionLogic(
            logicId,
            logicData
          );

        setLogicRecords(
          (currentRecords) =>
            currentRecords.map(
              (logicRecord) =>
                logicRecord.logic_id ===
                updatedLogic.logic_id
                  ? updatedLogic
                  : logicRecord
            )
        );

        setSelectedLogic(
          updatedLogic
        );

        return updatedLogic;
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to update Question Logic."
          );

        setError(message);

        throw requestError;
      } finally {
        setSaving(false);
      }
    },
    [normalizeErrorMessage]
  );

  const removeLogic = useCallback(
    async (logicId) => {
      try {
        setDeleting(true);
        setError("");

        const deletedLogic =
          await deleteEnterpriseQuestionLogic(
            logicId
          );

        setLogicRecords(
          (currentRecords) =>
            currentRecords.filter(
              (logicRecord) =>
                logicRecord.logic_id !==
                logicId
            )
        );

        setSelectedLogic(
          (currentSelectedLogic) =>
            currentSelectedLogic?.logic_id ===
            logicId
              ? null
              : currentSelectedLogic
        );

        return deletedLogic;
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to delete Question Logic."
          );

        setError(message);

        throw requestError;
      } finally {
        setDeleting(false);
      }
    },
    [normalizeErrorMessage]
  );

  const clearSelection =
    useCallback(() => {
      setSelectedLogic(null);
    }, []);

  return {
    logicRecords,
    selectedLogic,

    loading,
    saving,
    deleting,
    error,

    loadLogicByQuestionId,
    loadLogicById,

    createLogic,
    updateLogic,
    removeLogic,

    clearSelection,
  };
}