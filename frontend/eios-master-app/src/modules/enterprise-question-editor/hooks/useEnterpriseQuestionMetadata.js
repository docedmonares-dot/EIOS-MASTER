import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getEnterpriseQuestionCategories,
  getEnterpriseQuestionTypes,
} from "../../../services/enterpriseQuestionMetadataService";

export default function useEnterpriseQuestionMetadata({
  autoLoad = true,
} = {}) {
  const [questionTypes, setQuestionTypes] =
    useState([]);

  const [categories, setCategories] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [lastLoadedAt, setLastLoadedAt] =
    useState(null);

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

  const loadMetadata = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        questionTypeData,
        categoryData,
      ] = await Promise.all([
        getEnterpriseQuestionTypes(),
        getEnterpriseQuestionCategories(),
      ]);

      const normalizedQuestionTypes =
        Array.isArray(questionTypeData)
          ? questionTypeData
          : [];

      const normalizedCategories =
        Array.isArray(categoryData)
          ? categoryData
          : [];

      setQuestionTypes(
        normalizedQuestionTypes
      );

      setCategories(
        normalizedCategories
      );

      setLastLoadedAt(new Date());

      return {
        questionTypes:
          normalizedQuestionTypes,
        categories:
          normalizedCategories,
      };
    } catch (requestError) {
      const message =
        normalizeErrorMessage(
          requestError,
          "Unable to load Enterprise Question metadata."
        );

      setError(message);

      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [normalizeErrorMessage]);

  const refreshMetadata =
    useCallback(async () => {
      return loadMetadata();
    }, [loadMetadata]);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    loadMetadata().catch(() => {
      /*
       * Error state is already handled
       * inside this hook.
       */
    });
  }, [
    autoLoad,
    loadMetadata,
  ]);

  return {
    questionTypes,
    categories,

    loading,
    error,
    lastLoadedAt,

    loadMetadata,
    refreshMetadata,
    clearError,
  };
}