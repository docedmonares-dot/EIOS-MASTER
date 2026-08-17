import {
  ChevronDown,
  LoaderCircle,
  MapPin,
  RotateCcw,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import "./EnterpriseHierarchySelector.css";

function normalizeNodes(nodes) {
  return Array.isArray(nodes)
    ? nodes.filter(Boolean)
    : [];
}

function resolveNodeId(node) {
  return (
    node?.id ??
    node?.geo_unit_id ??
    node?.value ??
    null
  );
}

function resolveNodeLabel(node) {
  return (
    node?.label ??
    node?.unit_name ??
    node?.official_name ??
    node?.name ??
    "Unnamed item"
  );
}

function resolveNodeType(node) {
  return (
    node?.type ??
    node?.type_name ??
    node?.classification ??
    ""
  );
}

function resolveNodeCode(node) {
  return (
    node?.code ??
    node?.official_code ??
    node?.local_code ??
    ""
  );
}

export default function EnterpriseHierarchySelector({
  label = "Location",
  rootLabel = "Select location",
  value = [],
  loading = false,
  disabled = false,
  errorMessage = "",
  helperText = "",
  onLoadRoots,
  onLoadChildren,
  onChange,
}) {
  const [levels, setLevels] =
    useState([]);

  const [loadingLevel, setLoadingLevel] =
    useState(null);

  const selectedPath = useMemo(
    () =>
      Array.isArray(value)
        ? value
        : [],
    [value]
  );

  useEffect(() => {
    let active = true;

    async function loadRoots() {
      if (!onLoadRoots) {
        setLevels([]);
        return;
      }

      try {
        setLoadingLevel(0);

        const roots =
          await onLoadRoots();

        if (!active) {
          return;
        }

        setLevels([
          normalizeNodes(roots),
        ]);
      } catch (error) {
        console.error(
          "Hierarchy roots loading failed:",
          error
        );

        if (active) {
          setLevels([]);
        }
      } finally {
        if (active) {
          setLoadingLevel(null);
        }
      }
    }

    loadRoots();

    return () => {
      active = false;
    };
  }, [onLoadRoots]);

  async function handleSelect(
    levelIndex,
    nodeId
  ) {
    const currentNodes =
      levels[levelIndex] || [];

    const selectedNode =
      currentNodes.find(
        (node) =>
          String(
            resolveNodeId(node)
          ) === String(nodeId)
      ) || null;

    const nextPath =
      selectedPath.slice(
        0,
        levelIndex
      );

    const nextLevels =
      levels.slice(
        0,
        levelIndex + 1
      );

    if (!selectedNode) {
      setLevels(nextLevels);
      onChange?.(nextPath);
      return;
    }

    nextPath[levelIndex] =
      selectedNode;

    onChange?.(nextPath);

    if (!onLoadChildren) {
      setLevels(nextLevels);
      return;
    }

    const selectedId =
      resolveNodeId(selectedNode);

    if (!selectedId) {
      setLevels(nextLevels);
      return;
    }

    try {
      setLoadingLevel(
        levelIndex + 1
      );

      const children =
        await onLoadChildren(
          selectedId,
          selectedNode
        );

      const normalizedChildren =
        normalizeNodes(children);

      if (
        normalizedChildren.length > 0
      ) {
        setLevels([
          ...nextLevels,
          normalizedChildren,
        ]);
      } else {
        setLevels(nextLevels);
      }
    } catch (error) {
      console.error(
        "Hierarchy children loading failed:",
        error
      );

      setLevels(nextLevels);
    } finally {
      setLoadingLevel(null);
    }
  }

  function handleReset() {
    onChange?.([]);

    setLevels((currentLevels) =>
      currentLevels.length > 0
        ? [currentLevels[0]]
        : []
    );
  }

  return (
    <section className="enterprise-hierarchy-selector">
      <div className="enterprise-hierarchy-selector__header">
        <div>
          <span>
            Hierarchical Selection
          </span>

          <h3>{label}</h3>

          {helperText && (
            <p>{helperText}</p>
          )}
        </div>

        <button
          type="button"
          onClick={handleReset}
          disabled={
            disabled ||
            selectedPath.length === 0
          }
        >
          <RotateCcw size={15} />
          Reset
        </button>
      </div>

      {errorMessage && (
        <div className="enterprise-hierarchy-selector__error">
          {errorMessage}
        </div>
      )}

      <div className="enterprise-hierarchy-selector__levels">
        {levels.map(
          (nodes, levelIndex) => {
            const selectedNode =
              selectedPath[
                levelIndex
              ];

            const selectedId =
              resolveNodeId(
                selectedNode
              );

            return (
              <label
                key={`level-${levelIndex}`}
                className="enterprise-hierarchy-selector__field"
              >
                <span>
                  {levelIndex === 0
                    ? rootLabel
                    : selectedPath[
                        levelIndex - 1
                      ]
                      ? `Select under ${resolveNodeLabel(
                          selectedPath[
                            levelIndex - 1
                          ]
                        )}`
                      : `Level ${
                          levelIndex + 1
                        }`}
                </span>

                <div className="enterprise-hierarchy-selector__select-wrap">
                  <select
                    value={
                      selectedId || ""
                    }
                    onChange={(event) =>
                      handleSelect(
                        levelIndex,
                        event.target.value
                      )
                    }
                    disabled={
                      disabled ||
                      loading ||
                      loadingLevel ===
                        levelIndex
                    }
                  >
                    <option value="">
                      Select an option
                    </option>

                    {nodes.map(
                      (node) => {
                        const nodeId =
                          resolveNodeId(
                            node
                          );

                        const nodeLabel =
                          resolveNodeLabel(
                            node
                          );

                        const nodeType =
                          resolveNodeType(
                            node
                          );

                        const nodeCode =
                          resolveNodeCode(
                            node
                          );

                        return (
                          <option
                            key={nodeId}
                            value={nodeId}
                          >
                            {nodeLabel}
                            {nodeType
                              ? ` — ${nodeType}`
                              : ""}
                            {nodeCode
                              ? ` (${nodeCode})`
                              : ""}
                          </option>
                        );
                      }
                    )}
                  </select>

                  {loadingLevel ===
                  levelIndex ? (
                    <LoaderCircle
                      size={16}
                      className="enterprise-hierarchy-selector__spinner"
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                    />
                  )}
                </div>
              </label>
            );
          }
        )}
      </div>

      {selectedPath.length > 0 && (
        <div className="enterprise-hierarchy-selector__breadcrumb">
          <MapPin size={16} />

          <span>
            {selectedPath
              .map(resolveNodeLabel)
              .join(" / ")}
          </span>
        </div>
      )}
    </section>
  );
}