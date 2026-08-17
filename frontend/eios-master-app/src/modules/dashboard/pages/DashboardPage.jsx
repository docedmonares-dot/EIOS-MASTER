import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  Database,
  FileCog,
  FilePlus2,
  FileText,
  Globe2,
  LayoutDashboard,
  Map,
  MonitorCog,
  ShieldCheck,
  SquarePen,
  UserCog,
  UserPlus,
  UsersRound,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

import { Link } from "react-router-dom";

import MainLayout from "../../../layouts/MainLayout";

import ActivityCard from "../../../components/dashboard/ActivityCard";
import QuickActionCard from "../../../components/dashboard/QuickActionCard";

import ExecutiveCommandCenter from "../../../components/dashboard/widgets/ExecutiveCommandCenter";
import ExecutiveOverview from "../../../components/dashboard/widgets/ExecutiveOverview";

import {
  getDashboardSummary,
} from "../../../services/dashboardService";

import {
  getEnterpriseJobSummary,
} from "../../../services/enterpriseJobService";

const enterpriseNavigationBooks = [
  {
    book: "Book II",
    title: "Enterprise Administration",
    description:
      "Identity, governance, master data, security, settings, and platform administration.",
    modules: [
      {
        title: "Administration Center",
        description:
          "Open the complete enterprise administration workspace.",
        icon: MonitorCog,
        path: "/administration",
      },
      {
        title: "User Administration",
        description:
          "Create, edit, activate, deactivate, and administer user accounts.",
        icon: UserCog,
        path: "/administration/users",
      },
      {
        title: "Enterprise Foundation",
        description:
          "Manage enterprise profile, governing principles, and defaults.",
        icon: FileCog,
        path: "/administration/enterprise-foundation",
      },
      {
        title: "Geographic Master",
        description:
          "Browse and manage the enterprise geographic hierarchy.",
        icon: Globe2,
        path: "/administration/geography",
      },
      {
        title: "Enterprise Job Manager",
        description:
          "Monitor imports, exports, reports, synchronization, and background jobs.",
        icon: BriefcaseBusiness,
        path: "/administration/enterprise-jobs",
      },
    ],
  },
  {
    book: "Book III",
    title: "Projects and Survey Engineering",
    description:
      "Create projects, design survey instruments, manage questions, and preview questionnaires.",
    modules: [
      {
        title: "Projects",
        description:
          "Manage enterprise projects, research programs, and operational initiatives.",
        icon: Building2,
        path: "/projects",
      },
      {
        title: "Survey Engine",
        description:
          "Create and manage survey projects and their operational configurations.",
        icon: ClipboardList,
        path: "/survey-builder",
      },
      {
        title: "Survey Studio",
        description:
          "Open the integrated survey development workspace.",
        icon: FilePlus2,
        path: "/survey-studio",
      },
      {
        title: "Enterprise Question Editor",
        description:
          "Design governed reusable questions, validation, logic, metadata, analytics, and enterprise mappings.",
        icon: SquarePen,
        path: "/enterprise-question-editor",
      },
    ],
  },
  {
    book: "Book IV",
    title: "Field Operations",
    description:
      "Manage deployment, enumerator activity, supervision, and field execution.",
    modules: [
      {
        title: "Deployment",
        description:
          "Plan teams, field assignments, operational areas, and survey deployment.",
        icon: UsersRound,
        path: "/deployment",
      },
      {
        title: "Enumerator Workspace",
        description:
          "Access assignments, interviews, offline work, and synchronization.",
        icon: UserPlus,
        path: "/enumerator",
      },
      {
        title: "Supervisor Console",
        description:
          "Monitor enumerator movement, submissions, and field quality.",
        icon: ShieldCheck,
        path: "/supervisor",
      },
    ],
  },
  {
    book: "Book V",
    title: "Analytics, GIS, and Repository",
    description:
      "Transform operational data into geographic intelligence, analysis, and institutional records.",
    modules: [
      {
        title: "Analytics",
        description:
          "Open survey results, performance indicators, trends, and intelligence.",
        icon: BarChart3,
        path: "/analytics",
      },
      {
        title: "GIS",
        description:
          "Visualize geographic coverage, field activity, and location intelligence.",
        icon: Map,
        path: "/gis",
      },
      {
        title: "Repository",
        description:
          "Manage datasets, reports, instruments, documents, and records.",
        icon: Database,
        path: "/repository",
      },
    ],
  },
];

export default function DashboardPage() {
  const [summary, setSummary] = useState({
    total_enumerators: 0,
    total_deployments: 0,
    today_attendance: 0,
    active_enumerators: 0,
    average_hours: 0,
  });

  const [jobSummary, setJobSummary] = useState({
    running_jobs: 0,
    queued_jobs: 0,
    completed_today: 0,
    failed_jobs: 0,
    total_jobs: 0,
    active_workers: 0,
    active_job_types: 0,
    executive_integration: "Checking",
  });

  const [dashboardLoading, setDashboardLoading] =
    useState(true);

  const [dashboardError, setDashboardError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setDashboardLoading(true);
        setDashboardError("");

        const [
          dashboardData,
          enterpriseJobData,
        ] = await Promise.all([
          getDashboardSummary(),
          getEnterpriseJobSummary(),
        ]);

        setSummary({
          total_enumerators:
            dashboardData?.total_enumerators ?? 0,

          total_deployments:
            dashboardData?.total_deployments ?? 0,

          today_attendance:
            dashboardData?.today_attendance ?? 0,

          active_enumerators:
            dashboardData?.active_enumerators ?? 0,

          average_hours:
            dashboardData?.average_hours ?? 0,
        });

        setJobSummary({
          running_jobs:
            enterpriseJobData?.running_jobs ?? 0,

          queued_jobs:
            enterpriseJobData?.queued_jobs ?? 0,

          completed_today:
            enterpriseJobData?.completed_today ?? 0,

          failed_jobs:
            enterpriseJobData?.failed_jobs ?? 0,

          total_jobs:
            enterpriseJobData?.total_jobs ?? 0,

          active_workers:
            enterpriseJobData?.active_workers ?? 0,

          active_job_types:
            enterpriseJobData?.active_job_types ?? 0,

          executive_integration:
            enterpriseJobData?.executive_integration ||
            "Connected",
        });
      } catch (error) {
        console.error(
          "Executive Dashboard loading failed:",
          error
        );

        setDashboardError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load the Executive Command Center."
        );
      } finally {
        setDashboardLoading(false);
      }
    }

    loadDashboard();
  }, []);

  return (
    <MainLayout>
      <section>
        <div className="dashboard-hero">
          <div>
            <span className="dashboard-overline">
              Enterprise Intelligence &amp; Operations System
            </span>

            <h1 className="dashboard-title">
              Executive Command Center
            </h1>

            <p className="dashboard-subtitle">
              Good Morning, Dr. Edwin Monares.
              <br />
              Welcome back. Here is today&apos;s operational
              overview and enterprise navigation center.
            </p>
          </div>
        </div>

        {dashboardError && (
          <div className="dashboard-loading-error">
            {dashboardError}
          </div>
        )}

        <ExecutiveOverview summary={summary} />

        <ExecutiveCommandCenter summary={summary} />

        {/* =====================================================
            ENTERPRISE NAVIGATION HUB
        ====================================================== */}

        <section className="executive-services">
          <div className="executive-services__header">
            <div>
              <span className="executive-services__overline">
                Enterprise Navigation Hub
              </span>

              <h2>Connected Enterprise Workspaces</h2>

              <p>
                Open every major EIOS workspace through the
                main dashboard. Each module remains connected
                to the enterprise navigation structure.
              </p>
            </div>

            <Link
              to="/administration"
              className="executive-services__link"
            >
              Open Administration
            </Link>
          </div>

          <div
            style={{
              display: "grid",
              gap: "24px",
            }}
          >
            {enterpriseNavigationBooks.map((book) => (
              <section
                key={book.book}
                style={{
                  padding: "20px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "14px",
                  background: "#ffffff",
                }}
              >
                <div
                  style={{
                    marginBottom: "16px",
                  }}
                >
                  <span className="executive-services__overline">
                    {book.book}
                  </span>

                  <h3
                    style={{
                      margin: "5px 0 6px",
                      fontSize: "20px",
                    }}
                  >
                    {book.title}
                  </h3>

                  <p
                    style={{
                      margin: 0,
                      color: "#64748b",
                    }}
                  >
                    {book.description}
                  </p>
                </div>

                <div className="dashboard-quick-actions">
                  {book.modules.map((module) => (
                    <QuickActionCard
                      key={module.path}
                      icon={module.icon}
                      title={module.title}
                      description={module.description}
                      actionLabel="Open"
                      to={module.path}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>

        {/* =====================================================
            ENTERPRISE JOB OPERATIONS
        ====================================================== */}

        <section className="executive-services">
          <div className="executive-services__header">
            <div>
              <span className="executive-services__overline">
                Book VIII · Enterprise Services
              </span>

              <h2>Enterprise Job Operations</h2>

              <p>
                Live processing status for imports, exports,
                analytics, reports, artificial intelligence,
                backups, synchronization, and notifications.
              </p>
            </div>

            <Link
              to="/administration/enterprise-jobs"
              className="executive-services__link"
            >
              Open Job Manager
            </Link>
          </div>

          <div className="executive-services__grid">
            <article className="executive-service-card">
              <div className="executive-service-card__icon">
                <BriefcaseBusiness size={22} />
              </div>

              <div>
                <span>Running Jobs</span>

                <strong>
                  {dashboardLoading
                    ? "..."
                    : jobSummary.running_jobs}
                </strong>

                <small>
                  Enterprise processes currently executing
                </small>
              </div>
            </article>

            <article className="executive-service-card">
              <div className="executive-service-card__icon">
                <Clock3 size={22} />
              </div>

              <div>
                <span>Queued Jobs</span>

                <strong>
                  {dashboardLoading
                    ? "..."
                    : jobSummary.queued_jobs}
                </strong>

                <small>
                  Jobs waiting for available workers
                </small>
              </div>
            </article>

            <article className="executive-service-card">
              <div className="executive-service-card__icon">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <span>Completed Today</span>

                <strong>
                  {dashboardLoading
                    ? "..."
                    : jobSummary.completed_today}
                </strong>

                <small>
                  Successfully completed enterprise jobs
                </small>
              </div>
            </article>

            <article className="executive-service-card">
              <div className="executive-service-card__icon">
                <CircleAlert size={22} />
              </div>

              <div>
                <span>Failed Jobs</span>

                <strong>
                  {dashboardLoading
                    ? "..."
                    : jobSummary.failed_jobs}
                </strong>

                <small>
                  Jobs requiring technical attention
                </small>
              </div>
            </article>
          </div>

          <div className="executive-services__footer">
            <span>
              Active job types:{" "}
              <strong>
                {dashboardLoading
                  ? "..."
                  : jobSummary.active_job_types}
              </strong>
            </span>

            <span>
              Active workers:{" "}
              <strong>
                {dashboardLoading
                  ? "..."
                  : jobSummary.active_workers}
              </strong>
            </span>

            <span>
              Total jobs:{" "}
              <strong>
                {dashboardLoading
                  ? "..."
                  : jobSummary.total_jobs}
              </strong>
            </span>

            <span>
              Executive integration:{" "}
              <strong className="executive-services__connected">
                {dashboardLoading
                  ? "Checking"
                  : jobSummary.executive_integration}
              </strong>
            </span>
          </div>
        </section>

        {/* =====================================================
            OPERATIONAL QUICK ACTIONS
        ====================================================== */}

        <h2 className="dashboard-section-title">
          Operational Quick Actions
        </h2>

        <div className="dashboard-quick-actions">
          <QuickActionCard
            icon={LayoutDashboard}
            title="Administration"
            description="Open enterprise administration, security, users, geography, and settings."
            actionLabel="Open"
            to="/administration"
          />

          <QuickActionCard
            icon={FilePlus2}
            title="New Project"
            description="Create and configure a new enterprise project."
            actionLabel="Create"
            to="/projects"
          />

          <QuickActionCard
            icon={ClipboardList}
            title="Create Survey"
            description="Build and prepare a new survey instrument."
            actionLabel="Build"
            to="/survey-builder"
          />

          <QuickActionCard
            icon={UsersRound}
            title="Deploy Team"
            description="Prepare and assign a new field deployment."
            actionLabel="Deploy"
            to="/deployment"
          />

          <QuickActionCard
            icon={UserPlus}
            title="Register Enumerator"
            description="Create a new enumerator account through User Administration."
            actionLabel="Register"
            to="/administration/users"
          />

          <QuickActionCard
            icon={BarChart3}
            title="View Analytics"
            description="Open executive dashboards, KPIs, and intelligence."
            actionLabel="View"
            to="/analytics"
          />

          <QuickActionCard
            icon={Globe2}
            title="Open GIS"
            description="View geographic coverage and field-location intelligence."
            actionLabel="Open"
            to="/gis"
          />

          <QuickActionCard
            icon={FileText}
            title="Repository"
            description="Open reports, documents, datasets, and institutional records."
            actionLabel="Open"
            to="/repository"
          />
        </div>

        <div className="dashboard-lower-grid">
          <ActivityCard />

          <div className="dashboard-placeholder">
            <h3>Notifications</h3>

            <p>
              System alerts, approvals, reminders, and
              operational notifications will appear here.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}