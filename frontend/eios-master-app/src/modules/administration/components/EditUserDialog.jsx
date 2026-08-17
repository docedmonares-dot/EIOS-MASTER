import {
  LoaderCircle,
  Save,
  X,
} from "lucide-react";

const ROLE_OPTIONS = [
  {
    value: "ADMIN",
    label: "System Administrator",
  },
  {
    value: "EXECUTIVE",
    label: "Executive / Project Director",
  },
  {
    value: "OPERATIONS_MANAGER",
    label: "Operations Manager",
  },
  {
    value: "SUPERVISOR",
    label: "Field Supervisor",
  },
  {
    value: "ENUMERATOR",
    label: "Enumerator",
  },
  {
    value: "STATISTICIAN",
    label: "Statistician / Research Analyst",
  },
  {
    value: "QUALITY_ASSURANCE",
    label: "Quality Assurance Officer",
  },
];

const STATUS_OPTIONS = [
  {
    value: "active",
    label: "Active",
  },
  {
    value: "disabled",
    label: "Disabled",
  },
  {
    value: "suspended",
    label: "Suspended",
  },
  {
    value: "locked",
    label: "Locked",
  },
];

export default function EditUserDialog({
  open = false,
  formData,
  saving = false,
  errorMessage = "",
  onChange,
  onClose,
  onSubmit,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "grid",
        placeItems: "center",
        padding: "20px",
        background: "rgba(15, 23, 42, 0.55)",
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "min(620px, 100%)",
          maxHeight: "90vh",
          overflowY: "auto",
          padding: "22px",
          borderRadius: "14px",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div>
            <span>Enterprise IAM</span>

            <h2 style={{ margin: "4px 0 0" }}>
              Edit User Account
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close edit-user form"
          >
            <X size={20} />
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              border: "1px solid #fecaca",
              borderRadius: "10px",
              background: "#fef2f2",
              color: "#991b1b",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gap: "15px",
          }}
        >
          <label>
            <span>Full Name *</span>

            <input
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={onChange}
              disabled={saving}
              autoFocus
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                minHeight: "42px",
              }}
            />
          </label>

          <label>
            <span>Username *</span>

            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={onChange}
              disabled={saving}
              autoComplete="off"
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                minHeight: "42px",
              }}
            />
          </label>

          <label>
            <span>Email Address *</span>

            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={onChange}
              disabled={saving}
              autoComplete="off"
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                minHeight: "42px",
              }}
            />
          </label>

          <label>
            <span>Primary Role *</span>

            <select
              name="role"
              value={formData.role}
              onChange={onChange}
              disabled={saving}
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                minHeight: "42px",
              }}
            >
              {ROLE_OPTIONS.map((role) => (
                <option
                  key={role.value}
                  value={role.value}
                >
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Account Status *</span>

            <select
              name="status"
              value={formData.status}
              onChange={onChange}
              disabled={saving}
              style={{
                display: "block",
                width: "100%",
                marginTop: "6px",
                minHeight: "42px",
              }}
            >
              {STATUS_OPTIONS.map((status) => (
                <option
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            marginTop: "22px",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            {saving ? (
              <LoaderCircle size={17} />
            ) : (
              <Save size={17} />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}