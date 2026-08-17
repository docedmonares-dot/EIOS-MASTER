import { Inbox } from "lucide-react";

export default function DataGridEmpty({
  title = "No records found",
  message = "There are no records available for this view.",
}) {
  return (
    <div className="eeui-datagrid__state">
      <Inbox size={28} aria-hidden="true" />

      <strong>{title}</strong>

      <span>{message}</span>
    </div>
  );
}