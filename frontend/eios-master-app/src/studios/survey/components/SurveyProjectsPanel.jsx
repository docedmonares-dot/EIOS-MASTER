import {
  FileText,
  Plus,
  Search,
} from "lucide-react";

import {
  EEUIBadge,
  EEUIButton,
  EEUIDataGrid,
  EEUIPanel,
} from "../../../eeui";

function getStatusVariant(status) {
  if (status === "Published") {
    return "success";
  }

  if (status === "Draft") {
    return "warning";
  }

  if (status === "Archived") {
    return "neutral";
  }

  return "info";
}

export default function SurveyProjectsPanel({
  projects = [],
  loading = false,
  searchTerm = "",
  selectedProjectIds = [],
  onSearchChange,
  onSelectionChange,
  onCreateSurvey,
  onOpenProject,
}) {
  const columns = [
    {
      key: "code",
      accessor: "code",
      label: "Code",
      width: "150px",
    },
    {
      key: "name",
      accessor: "name",
      label: "Survey Project",
      width: "260px",
      render: (value, row) => (
        <div className="survey-project-grid__identity">
          <FileText size={18} />

          <div>
            <strong>{value}</strong>
            <span>{row.organization}</span>
          </div>
        </div>
      ),
    },
    {
      key: "coverage",
      accessor: "coverage",
      label: "Coverage",
      width: "170px",
    },
    {
      key: "status",
      accessor: "status",
      label: "Status",
      width: "120px",
      align: "center",
      render: (value) => (
        <EEUIBadge variant={getStatusVariant(value)}>
          {value}
        </EEUIBadge>
      ),
    },
    {
      key: "version",
      accessor: "version",
      label: "Version",
      width: "100px",
      align: "center",
    },
    {
      key: "questions",
      accessor: "questions",
      label: "Questions",
      width: "110px",
      align: "center",
    },
    {
      key: "updated",
      accessor: "updated",
      label: "Updated",
      width: "150px",
    },
    {
      key: "actions",
      label: "Actions",
      width: "110px",
      align: "center",
      sortable: false,
      render: (_, row) => (
        <EEUIButton
          size="small"
          variant="secondary"
          onClick={() => onOpenProject?.(row)}
        >
          Open
        </EEUIButton>
      ),
    },
  ];

  return (
    <EEUIPanel
      title="Survey Projects"
      subtitle={`${projects.length} project records`}
      headerActions={
        <div className="survey-project-toolbar">
          <label className="survey-project-toolbar__search">
            <Search size={16} />

            <input
              type="search"
              value={searchTerm}
              onChange={(event) =>
                onSearchChange?.(event.target.value)
              }
              placeholder="Search survey projects..."
            />
          </label>

          <EEUIButton
            size="small"
            icon={Plus}
            onClick={onCreateSurvey}
          >
            New Survey
          </EEUIButton>
        </div>
      }
    >
      <EEUIDataGrid
        columns={columns}
        rows={projects}
        rowKey="id"
        loading={loading}
        selectable
        selectedRowKeys={selectedProjectIds}
        onSelectionChange={onSelectionChange}
        sortable
        defaultSortKey="updated_at"
        defaultSortDirection="desc"
        onRowClick={onOpenProject}
        emptyTitle="No survey projects found"
        emptyMessage="Try adjusting the search term or create a new survey project."
        loadingMessage="Loading survey projects..."
      />
    </EEUIPanel>
  );
}