import {
  useCallback,
  useState,
} from "react";

import {
  getEnterpriseChoiceListById,
  getEnterpriseChoiceLists,
} from "../../../services/enterpriseChoiceLibraryService";

export default function useEnterpriseChoiceLibrary() {
  const [choiceLists, setChoiceLists] =
    useState([]);

  const [selectedChoiceList, setSelectedChoiceList] =
    useState(null);

  const [choiceItems, setChoiceItems] =
    useState([]);

  const [loading, setLoading] =
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

  const loadChoiceLists = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getEnterpriseChoiceLists();

        const normalizedLists =
          Array.isArray(data)
            ? data
            : [];

        setChoiceLists(normalizedLists);

        return normalizedLists;
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to load Enterprise Choice Lists."
          );

        setError(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [normalizeErrorMessage]
  );

  const loadChoiceListById = useCallback(
    async (choiceListId) => {
      try {
        setLoading(true);
        setError("");

        const data =
          await getEnterpriseChoiceListById(
            choiceListId
          );

        const choiceList =
          data?.choice_list || null;

        const items =
          Array.isArray(data?.items)
            ? data.items
            : [];

        setSelectedChoiceList(choiceList);
        setChoiceItems(items);

        return {
          choice_list: choiceList,
          items,
        };
      } catch (requestError) {
        const message =
          normalizeErrorMessage(
            requestError,
            "Unable to load the Enterprise Choice List."
          );

        setError(message);

        throw requestError;
      } finally {
        setLoading(false);
      }
    },
    [normalizeErrorMessage]
  );

  const clearChoiceList = useCallback(() => {
    setSelectedChoiceList(null);
    setChoiceItems([]);
    setError("");
  }, []);

  return {
    choiceLists,
    selectedChoiceList,
    choiceItems,
    loading,
    error,

    loadChoiceLists,
    loadChoiceListById,
    clearChoiceList,
  };
}