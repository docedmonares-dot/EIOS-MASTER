import { useCallback, useMemo, useState } from "react";

import { EnterpriseHierarchySelector } from "../../../eeui";
import {
  getGeographicChildren,
  getGeographicRoots,
} from "../../../services/geographicMasterService";

function normalizePath(path) {
  return (Array.isArray(path) ? path : []).map((node) => ({
    geo_unit_id: node.geo_unit_id ?? null,
    parent_geo_unit_id: node.parent_geo_unit_id ?? null,
    official_code: node.official_code ?? null,
    local_code: node.local_code ?? null,
    unit_name: node.unit_name ?? "",
    official_name: node.official_name ?? null,
    short_name: node.short_name ?? null,
    classification: node.classification ?? null,
    hierarchy_level: node.hierarchy_level ?? null,
    type_code: node.type_code ?? null,
    type_name: node.type_name ?? null,
    latitude: node.latitude ?? null,
    longitude: node.longitude ?? null,
    is_official: Boolean(node.is_official),
    is_operational: Boolean(node.is_operational),
  }));
}

function buildGeographicAnswer(path) {
  const normalizedPath = normalizePath(path);
  const selected = normalizedPath.at(-1) ?? null;

  return {
    schema: "eios.geographic-selection.v1",
    path: normalizedPath,
    selected_geo_unit_id: selected?.geo_unit_id ?? null,
    selected_official_code: selected?.official_code ?? null,
    selected_unit_name: selected?.unit_name ?? null,
    selected_type_code: selected?.type_code ?? null,
    selected_type_name: selected?.type_name ?? null,
    hierarchy_level: selected?.hierarchy_level ?? null,
  };
}

export default function GeographicSelectorControl({
  question,
  value,
  onChange,
  disabled = false,
}) {
  const [errorMessage, setErrorMessage] = useState("");
  const settings = question?.settings ?? {};
  const typeSettings = question?.question_type?.default_settings ?? {};
  const countryCode =
    settings.country_code ?? typeSettings.country_code ?? "PH";
  const selectedPath = useMemo(
    () => (Array.isArray(value) ? value : value?.path ?? []),
    [value]
  );

  const loadRoots = useCallback(async () => {
    try {
      setErrorMessage("");
      return await getGeographicRoots(countryCode);
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ??
          error.message ??
          "Unable to load geographic reference data."
      );
      return [];
    }
  }, [countryCode]);

  const loadChildren = useCallback(async (parentId) => {
    try {
      setErrorMessage("");
      const response = await getGeographicChildren(parentId);
      return response?.data ?? [];
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ??
          error.message ??
          "Unable to load the next geographic level."
      );
      return [];
    }
  }, []);

  return (
    <EnterpriseHierarchySelector
      label="Geographic Location"
      rootLabel={settings.root_label ?? typeSettings.root_label ?? "Select geographic area"}
      value={selectedPath}
      disabled={disabled}
      errorMessage={errorMessage}
      helperText={question?.help_text ?? "Select an official geographic location."}
      onLoadRoots={loadRoots}
      onLoadChildren={loadChildren}
      onChange={(path) => onChange?.(buildGeographicAnswer(path))}
    />
  );
}
