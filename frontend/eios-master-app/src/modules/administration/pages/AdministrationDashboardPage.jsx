import {
  Activity,
  BriefcaseBusiness,
  Building2,
  Database,
  FileCog,
  Globe2,
  KeyRound,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";

import MainLayout from "../../../layouts/MainLayout";

const administrationModules = [
  {
    title: "Enterprise Foundation",
    description:
      "Manage the enterprise profile, governing principles, and system-wide defaults.",
    icon: FileCog,
    path: "/administration/enterprise-foundation",
  },
  {
    title: "Organizations",
    description:
      "Manage organizations, institutional units, offices, and enterprise ownership.",
    icon: Building2,
    path: "/administration/organizations",
  },
  {
    title: "Users",
    description:
      "Create, update, activate, deactivate, and administer enterprise user accounts.",
    icon: Users,
    path: "/administration/users",
  },
  {
    title: "Roles and Permissions",
    description:
      "Configure dynamic roles, access rights, and role-based permissions.",
    icon: ShieldCheck,
    path: "/administration/roles",
  },
  {
    title: "Geographic Master",
    description:
      "Manage PSGC regions, provinces, cities, municipalities, barangays, and local areas.",
    icon: Globe2,
    path: "/administration/geography",
  },
  {
    title: "Enterprise Job Manager",
    description:
      "Monitor imports, exports, reports, analytics, AI processing, backups, synchronization, and other background jobs.",
    icon: BriefcaseBusiness,
    path: "/administration/enterprise-jobs",
  },
  {
    title: "Enterprise Settings",
    description:
      "Configure field operations, GPS, synchronization, platform, and survey defaults.",
    icon: Settings,
    path: "/administration/settings",
  },
  {
    title: "Security",
    description:
      "Manage authentication, password rules, sessions, and security controls.",
    icon: KeyRound,
    path: "/administration/security",
  },
  {
    title: "Audit Trail",
    description:
      "Review material user actions, configuration changes, and system events.",
    icon: Activity,
    path: "/administration/audit",
  },
  {
    title: "System Health",
    description:
      "Monitor database, API, storage, jobs, backups, and platform readiness.",
    icon: Database,
    path: "/administration/system-health",
  },
];

export default function AdministrationDashboardPage() {
  return (
    <MainLayout>
      <section className="administration-dashboard-page">

        <div className="administration-dashboard-page__header">

          <span className="administration-dashboard-page__overline">
            BOOK II · ENTERPRISE ADMINISTRATION
          </span>

          <h1>Enterprise Administration</h1>

          <p>
            Central administration console for enterprise configuration,
            governance, security, identity management, master data,
            enterprise operations, and platform health.
          </p>

        </div>

        <div className="administration-dashboard-page__summary">

          <article>
            <span>Enterprise Modules</span>
            <strong>{administrationModules.length}</strong>
          </article>

          <article>
            <span>Configuration Model</span>
            <strong>Centralized</strong>
          </article>

          <article>
            <span>Architecture</span>
            <strong>Enterprise</strong>
          </article>

          <article>
            <span>Status</span>
            <strong className="administration-dashboard-page__online">
              ONLINE
            </strong>
          </article>

        </div>

        <div className="administration-dashboard-page__grid">

          {administrationModules.map((module) => {

            const Icon = module.icon;

            return (

              <Link
                key={module.path}
                to={module.path}
                className="administration-module-card"
              >

                <div className="administration-module-card__icon">
                  <Icon size={24} />
                </div>

                <div>

                  <h2>{module.title}</h2>

                  <p>{module.description}</p>

                  <span>Open module →</span>

                </div>

              </Link>

            );

          })}

        </div>

      </section>
    </MainLayout>
  );
}