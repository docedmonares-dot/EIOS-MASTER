import {
  Archive,
  LoaderCircle,
  Pencil,
  ShieldCheck,
  Users,
} from "lucide-react";

function formatDate(value) {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

export default function UserTable({
  users = [],
  loading = false,
  archivingId = "",
  onEdit,
  onArchive,
}) {
  return (
    <div
      style={{
        overflowX: "auto",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        background: "#ffffff",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          minWidth: "980px",
        }}
      >
        <thead>
          <tr>
            <th style={{ padding: "14px", textAlign: "left" }}>
              User
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Username
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Role
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Status
            </th>

            <th style={{ padding: "14px", textAlign: "left" }}>
              Last Login
            </th>

            <th style={{ padding: "14px", textAlign: "right" }}>
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "30px",
                  textAlign: "center",
                }}
              >
                <LoaderCircle
                  size={24}
                  className="spin"
                />

                <div>Loading enterprise users...</div>
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                style={{
                  padding: "34px",
                  textAlign: "center",
                }}
              >
                <Users size={30} />

                <div>No matching users found.</div>
              </td>
            </tr>
          ) : (
            users.map((user) => (
              <tr
                key={`${user.user_id}-${user.role_code || "no-role"}`}
                style={{
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <td style={{ padding: "14px" }}>
                  <strong>
                    {user.full_name || "Unnamed User"}
                  </strong>

                  <div
                    style={{
                      marginTop: "3px",
                      fontSize: "13px",
                      color: "#6b7280",
                    }}
                  >
                    {user.email || "No email"}
                  </div>
                </td>

                <td style={{ padding: "14px" }}>
                  {user.username || "Not assigned"}
                </td>

                <td style={{ padding: "14px" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <ShieldCheck size={16} />

                    {user.role_name ||
                      user.role_code ||
                      "No active role"}
                  </span>
                </td>

                <td style={{ padding: "14px" }}>
                  {user.status || "Unknown"}
                </td>

                <td style={{ padding: "14px" }}>
                  {formatDate(user.last_login_at)}
                </td>

                <td
                  style={{
                    padding: "14px",
                    textAlign: "right",
                  }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      gap: "8px",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => onArchive(user)}
                      disabled={archivingId === user.user_id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                      }}
                    >
                      {archivingId === user.user_id ? (
                        <LoaderCircle size={16} />
                      ) : (
                        <Archive size={16} />
                      )}

                      Archive
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}