import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
} from "lucide-react";

import DataGridCell from "./DataGridCell";

export default function DataGridHeader({
  columns = [],
  selectable = false,
  allSelected = false,
  onToggleAll = null,
  sortKey = "",
  sortDirection = "",
  onSort = null,
}) {
  function renderSortIcon(columnKey) {
    if (sortKey !== columnKey) {
      return <ChevronsUpDown size={14} />;
    }

    if (sortDirection === "asc") {
      return <ArrowUp size={14} />;
    }

    return <ArrowDown size={14} />;
  }

  return (
    <div
      className="eeui-datagrid__header"
      role="row"
    >
      {selectable && (
        <div
          className="eeui-datagrid__selection-cell"
          role="columnheader"
        >
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            aria-label="Select all rows"
          />
        </div>
      )}

      {columns.map((column) => {
        const columnKey =
          column.key || column.accessor;

        const isSortable =
          column.sortable !== false &&
          Boolean(onSort);

        return (
          <DataGridCell
            key={columnKey}
            align={column.align || "left"}
            width={column.width || ""}
            className="eeui-datagrid__header-cell"
            role="columnheader"
          >
            {isSortable ? (
              <button
                type="button"
                className="eeui-datagrid__sort-button"
                onClick={() => onSort(columnKey)}
              >
                <span>{column.label}</span>

                {renderSortIcon(columnKey)}
              </button>
            ) : (
              <span>{column.label}</span>
            )}
          </DataGridCell>
        );
      })}
    </div>
  );
}