import { LoaderCircle } from "lucide-react";

export default function DataGridLoading({
  message = "Loading records...",
}) {
  return (
    <div
      className="eeui-datagrid__state"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        size={24}
        className="eeui-datagrid__spinner"
        aria-hidden="true"
      />

      <strong>{message}</strong>
    </div>
  );
}