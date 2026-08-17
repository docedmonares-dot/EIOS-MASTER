import {
  useMemo,
  useState,
} from "react";

import "./EEUIDataGrid.css";

import DataGridBody from "./DataGridBody";
import DataGridHeader from "./DataGridHeader";

export default function EEUIDataGrid({
  columns = [],
  rows = [],
  rowKey = "id",
  loading = false,
  selectable = false,
  selectedRowKeys: controlledSelectedRowKeys,
  onSelectionChange = null,
  onRowClick = null,
  sortable = true,
  defaultSortKey = "",
  defaultSortDirection = "asc",
  emptyTitle = "No records found",
  emptyMessage = "There are no records available for this view.",
  loadingMessage = "Loading records...",
  className = "",
  ...gridProps
}) {
  const [
    internalSelectedRowKeys,
    setInternalSelectedRowKeys,
  ] = useState([]);

  const [sortKey, setSortKey] =
    useState(defaultSortKey);

  const [sortDirection, setSortDirection] =
    useState(defaultSortDirection);

  const selectedRowKeys =
    controlledSelectedRowKeys ??
    internalSelectedRowKeys;

  const resolvedRows = useMemo(() => {
    if (!sortable || !sortKey) {
      return rows;
    }

    return [...rows].sort((leftRow, rightRow) => {
      const leftValue = leftRow?.[sortKey];
      const rightValue = rightRow?.[sortKey];

      if (leftValue == null && rightValue == null) {
        return 0;
      }

      if (leftValue == null) {
        return 1;
      }

      if (rightValue == null) {
        return -1;
      }

      const comparison =
        typeof leftValue === "number" &&
        typeof rightValue === "number"
          ? leftValue - rightValue
          : String(leftValue).localeCompare(
              String(rightValue),
              undefined,
              {
                numeric: true,
                sensitivity: "base",
              }
            );

      return sortDirection === "asc"
        ? comparison
        : -comparison;
    });
  }, [
    rows,
    sortable,
    sortKey,
    sortDirection,
  ]);

  const resolvedRowKeys = useMemo(
    () =>
      resolvedRows.map((row, index) =>
        typeof rowKey === "function"
          ? rowKey(row)
          : row?.[rowKey] ?? row?.id ?? index
      ),
    [resolvedRows, rowKey]
  );

  const allSelected =
    resolvedRowKeys.length > 0 &&
    resolvedRowKeys.every((key) =>
      selectedRowKeys.includes(key)
    );

  function updateSelection(nextSelection) {
    if (
      controlledSelectedRowKeys === undefined
    ) {
      setInternalSelectedRowKeys(
        nextSelection
      );
    }

    onSelectionChange?.(nextSelection);
  }

  function handleToggleAll() {
    if (allSelected) {
      updateSelection(
        selectedRowKeys.filter(
          (key) =>
            !resolvedRowKeys.includes(key)
        )
      );

      return;
    }

    updateSelection([
      ...new Set([
        ...selectedRowKeys,
        ...resolvedRowKeys,
      ]),
    ]);
  }

  function handleToggleRow(
    resolvedRowKey
  ) {
    const nextSelection =
      selectedRowKeys.includes(
        resolvedRowKey
      )
        ? selectedRowKeys.filter(
            (key) =>
              key !== resolvedRowKey
          )
        : [
            ...selectedRowKeys,
            resolvedRowKey,
          ];

    updateSelection(nextSelection);
  }

  function handleSort(columnKey) {
    if (!sortable) {
      return;
    }

    if (sortKey === columnKey) {
      setSortDirection(
        (currentDirection) =>
          currentDirection === "asc"
            ? "desc"
            : "asc"
      );

      return;
    }

    setSortKey(columnKey);
    setSortDirection("asc");
  }

  const classes = [
    "eeui-datagrid",
    selectable
      ? "eeui-datagrid--selectable"
      : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      role="table"
      aria-rowcount={
        loading ? undefined : rows.length
      }
      {...gridProps}
    >
      <div className="eeui-datagrid__viewport">
        <DataGridHeader
          columns={columns}
          selectable={selectable}
          allSelected={allSelected}
          onToggleAll={handleToggleAll}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={
            sortable
              ? handleSort
              : null
          }
        />

        <DataGridBody
          rows={resolvedRows}
          columns={columns}
          rowKey={rowKey}
          selectable={selectable}
          selectedRowKeys={selectedRowKeys}
          loading={loading}
          loadingMessage={loadingMessage}
          emptyTitle={emptyTitle}
          emptyMessage={emptyMessage}
          onToggleRow={handleToggleRow}
          onRowClick={onRowClick}
        />
      </div>
    </div>
  );
}