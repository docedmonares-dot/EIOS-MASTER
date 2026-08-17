import DataGridCell from "./DataGridCell";

export default function DataGridRow({
  row,
  columns = [],
  rowKey,
  selectable = false,
  selected = false,
  onToggle = null,
  onRowClick = null,
}) {
  const resolvedRowKey =
    typeof rowKey === "function"
      ? rowKey(row)
      : row?.[rowKey] ?? row?.id;

  function handleRowClick(event) {
    if (
      event.target.closest(
        "button, input, a, select, textarea"
      )
    ) {
      return;
    }

    if (onRowClick) {
      onRowClick(row);
    }
  }

  return (
    <div
      className={
        selected
          ? "eeui-datagrid__row eeui-datagrid__row--selected"
          : "eeui-datagrid__row"
      }
      role="row"
      tabIndex={onRowClick ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={(event) => {
        if (
          onRowClick &&
          (event.key === "Enter" ||
            event.key === " ")
        ) {
          event.preventDefault();
          onRowClick(row);
        }
      }}
      data-row-key={resolvedRowKey}
    >
      {selectable && (
        <div
          className="eeui-datagrid__selection-cell"
          role="cell"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() =>
              onToggle?.(resolvedRowKey, row)
            }
            aria-label={`Select row ${resolvedRowKey}`}
          />
        </div>
      )}

      {columns.map((column) => {
        const columnKey =
          column.key || column.accessor;

        const value = column.accessor
          ? row?.[column.accessor]
          : row?.[columnKey];

        const content = column.render
          ? column.render(value, row)
          : value ?? "—";

        return (
          <DataGridCell
            key={columnKey}
            align={column.align || "left"}
            width={column.width || ""}
            className={column.className || ""}
          >
            {content}
          </DataGridCell>
        );
      })}
    </div>
  );
}