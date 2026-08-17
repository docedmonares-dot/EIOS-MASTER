import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import MainLayout from "../../../layouts/MainLayout";

import CreateUserDialog from "../components/CreateUserDialog";
import EditUserDialog from "../components/EditUserDialog";
import UserStatistics from "../components/UserStatistics";
import UserTable from "../components/UserTable";
import UserToolbar from "../components/UserToolbar";

import {
  archiveEnterpriseUser,
  createEnterpriseUser,
  getEnterpriseUsers,
  updateEnterpriseUser,
} from "../../../services/adminUserService";

const EMPTY_CREATE_FORM = {
  username: "",
  full_name: "",
  email: "",
  password: "",
  role: "ENUMERATOR",
};

const EMPTY_EDIT_FORM = {
  user_id: "",
  username: "",
  full_name: "",
  email: "",
  role: "ENUMERATOR",
  status: "active",
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "The requested operation failed."
  );
}

function normalizeStatus(value) {
  return String(value || "active").toLowerCase();
}

export default function UserAdministrationPage() {
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivingId, setArchivingId] = useState("");

  const [createDialogOpen, setCreateDialogOpen] =
    useState(false);

  const [editDialogOpen, setEditDialogOpen] =
    useState(false);

  const [createFormData, setCreateFormData] =
    useState(EMPTY_CREATE_FORM);

  const [editFormData, setEditFormData] =
    useState(EMPTY_EDIT_FORM);

  const [pageError, setPageError] = useState("");
  const [dialogError, setDialogError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const result = await getEnterpriseUsers();

      setUsers(Array.isArray(result) ? result : []);
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    if (!query) {
      return users;
    }

    return users.filter((user) => {
      const searchableText = [
        user.username,
        user.full_name,
        user.email,
        user.role_code,
        user.role_name,
        user.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [searchText, users]);

  const activeUsers = useMemo(
    () =>
      users.filter(
        (user) =>
          normalizeStatus(user.status) === "active"
      ).length,
    [users]
  );

  const roleCount = useMemo(
    () =>
      new Set(
        users
          .map((user) => user.role_code)
          .filter(Boolean)
      ).size,
    [users]
  );

  function clearMessages() {
    setPageError("");
    setDialogError("");
    setSuccessMessage("");
  }

  function openCreateDialog() {
    clearMessages();
    setCreateFormData(EMPTY_CREATE_FORM);
    setCreateDialogOpen(true);
  }

  function closeCreateDialog() {
    if (saving) {
      return;
    }

    setCreateDialogOpen(false);
    setCreateFormData(EMPTY_CREATE_FORM);
    setDialogError("");
  }

  function openEditDialog(user) {
    clearMessages();

    setEditFormData({
      user_id: user.user_id,
      username: user.username || "",
      full_name: user.full_name || "",
      email: user.email || "",
      role:
        user.role_code ||
        user.legacy_role ||
        "ENUMERATOR",
      status: normalizeStatus(user.status),
    });

    setEditDialogOpen(true);
  }

  function closeEditDialog() {
    if (saving) {
      return;
    }

    setEditDialogOpen(false);
    setEditFormData(EMPTY_EDIT_FORM);
    setDialogError("");
  }

  function handleCreateInputChange(event) {
    const { name, value } = event.target;

    setCreateFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (dialogError) {
      setDialogError("");
    }
  }

  function handleEditInputChange(event) {
    const { name, value } = event.target;

    setEditFormData((current) => ({
      ...current,
      [name]: value,
    }));

    if (dialogError) {
      setDialogError("");
    }
  }

  async function handleCreateUser(event) {
    event.preventDefault();

    const payload = {
      username: createFormData.username.trim(),
      full_name: createFormData.full_name.trim(),
      email: createFormData.email
        .trim()
        .toLowerCase(),
      password: createFormData.password,
      role: createFormData.role,
    };

    if (
      !payload.username ||
      !payload.full_name ||
      !payload.email ||
      !payload.password ||
      !payload.role
    ) {
      setDialogError(
        "Complete all required fields."
      );
      return;
    }

    if (payload.password.length < 8) {
      setDialogError(
        "The temporary password must contain at least eight characters."
      );
      return;
    }

    try {
      setSaving(true);
      setDialogError("");
      setSuccessMessage("");

      await createEnterpriseUser(payload);

      setCreateDialogOpen(false);
      setCreateFormData(EMPTY_CREATE_FORM);

      setSuccessMessage(
        "User account created successfully."
      );

      await loadUsers();
    } catch (error) {
      setDialogError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateUser(event) {
    event.preventDefault();

    const payload = {
      username: editFormData.username.trim(),
      full_name: editFormData.full_name.trim(),
      email: editFormData.email
        .trim()
        .toLowerCase(),
      role: editFormData.role,
      status: normalizeStatus(
        editFormData.status
      ),
    };

    if (
      !editFormData.user_id ||
      !payload.username ||
      !payload.full_name ||
      !payload.email ||
      !payload.role ||
      !payload.status
    ) {
      setDialogError(
        "Complete all required fields."
      );
      return;
    }

    try {
      setSaving(true);
      setDialogError("");
      setSuccessMessage("");

      await updateEnterpriseUser(
        editFormData.user_id,
        payload
      );

      setEditDialogOpen(false);
      setEditFormData(EMPTY_EDIT_FORM);

      setSuccessMessage(
        "User account updated successfully."
      );

      await loadUsers();
    } catch (error) {
      setDialogError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleArchiveUser(user) {
    const confirmed = window.confirm(
      `Archive the account of ${
        user.full_name || user.email
      }?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setArchivingId(user.user_id);
      setPageError("");
      setSuccessMessage("");

      await archiveEnterpriseUser(user.user_id);

      setSuccessMessage(
        "User account archived successfully."
      );

      await loadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setArchivingId("");
    }
  }

  return (
    <MainLayout>
      <section className="administration-dashboard-page">
        <div className="administration-dashboard-page__header">
          <span className="administration-dashboard-page__overline">
            Enterprise Identity and Access Management
          </span>

          <h1>User Administration</h1>

          <p>
            Create and administer the accounts used by
            administrators, executives, operations managers,
            supervisors, enumerators, statisticians, and
            quality-assurance personnel.
          </p>
        </div>

        <UserStatistics
          totalAccounts={users.length}
          activeAccounts={activeUsers}
          assignedRoles={roleCount}
        />

        {pageError && (
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
            {pageError}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            style={{
              marginBottom: "16px",
              padding: "12px 14px",
              border: "1px solid #bbf7d0",
              borderRadius: "10px",
              background: "#f0fdf4",
              color: "#166534",
            }}
          >
            {successMessage}
          </div>
        )}

        <UserToolbar
          searchText={searchText}
          onSearchChange={setSearchText}
          onRefresh={loadUsers}
          onCreate={openCreateDialog}
          loading={loading}
        />

        <UserTable
          users={filteredUsers}
          loading={loading}
          archivingId={archivingId}
          onEdit={openEditDialog}
          onArchive={handleArchiveUser}
        />
      </section>

      <CreateUserDialog
        open={createDialogOpen}
        formData={createFormData}
        saving={saving}
        errorMessage={dialogError}
        onChange={handleCreateInputChange}
        onClose={closeCreateDialog}
        onSubmit={handleCreateUser}
      />

      <EditUserDialog
        open={editDialogOpen}
        formData={editFormData}
        saving={saving}
        errorMessage={dialogError}
        onChange={handleEditInputChange}
        onClose={closeEditDialog}
        onSubmit={handleUpdateUser}
      />
    </MainLayout>
  );
}