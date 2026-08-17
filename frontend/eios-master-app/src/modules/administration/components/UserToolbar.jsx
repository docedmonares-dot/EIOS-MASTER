import {
  RefreshCw,
  Search,
  UserPlus,
} from "lucide-react";

export default function UserToolbar({
  searchText,
  onSearchChange,
  onRefresh,
  onCreate,
  loading = false,
}) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          position: "relative",
          flex: "1 1 320px",
          maxWidth: "520px",
        }}
      >
        <Search
          size={18}
          style={{
            position: "absolute",
            top: "50%",
            left: "13px",
            transform: "translateY(-50%)",
            pointerEvents: "none",
          }}
        />

        <input
          type="search"
          value={searchText}
          onChange={(event) =>
            onSearchChange(event.target.value)
          }
          placeholder="Search by name, username, email, role, or status"
          style={{
            width: "100%",
            minHeight: "44px",
            padding: "10px 14px 10px 42px",
            border: "1px solid #d1d5db",
            borderRadius: "10px",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: "10px",
        }}
      >
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "9px 14px",
          }}
        >
          <RefreshCw size={17} />
          Refresh
        </button>

        <button
          type="button"
          onClick={onCreate}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            minHeight: "44px",
            padding: "9px 14px",
          }}
        >
          <UserPlus size={18} />
          Create User
        </button>
      </div>
    </div>
  );
}