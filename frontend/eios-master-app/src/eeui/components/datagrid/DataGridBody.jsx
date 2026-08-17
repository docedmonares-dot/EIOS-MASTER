import DataGridEmpty from "./DataGridEmpty";
import DataGridLoading from "./DataGridLoading";
import DataGridRow from "./DataGridRow";

export default function DataGridBody({
  rows = [],
  columns = [],
  rowKey = "id",
  selectable = false,
  selectedRowKeys = [],
  loading = false,
  loadingMessage = "Loading records...",
  emptyTitle = "No records found",
  emptyMessage = "There are no records available for this view.",
  onToggleRow = null,
  onRowClick = null,
}) {
  if (loading) {
    return (
      <DataGridLoading
        message={loadingMessage}
      />
    );
  }

  if (rows.length === 0) {
    return (
      <DataGridEmpty
        title={emptyTitle}
        message={emptyMessage}
      />
    );
  }

  return (
    <div
      className="eeui-datagrid__body"
      role="rowgroup"
    >
      {rows.map((row, index) => {
        const resolvedRowKey =
          typeof rowKey === "function"
            ? rowKey(row)
            : row?.[rowKey] ?? row?.id ?? index;

        return (
          <DataGridRow
            key={resolvedRowKey}
            row={row}
            columns={columns}
            rowKey={rowKey}
            selectable={selectable}
            selected={selectedRowKeys.includes(
              resolvedRowKey
            )}
            onToggle={onToggleRow}
            onRowClick={onRowClick}
          />
        );
      })}
    </div>
  );
}