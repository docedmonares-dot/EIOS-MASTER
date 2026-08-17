import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ClipboardList,
  Database,
  Gauge,
  Globe2,
  Map,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

export const ENTERPRISE_ROLES = {
  ADMIN: "admin",
  ENUMERATOR: "enumerator",
  SUPERVISOR: "supervisor",
  OPERATIONS_MANAGER: "operations_manager",
  STATISTICIAN: "statistician",
  EXECUTIVE: "executive",
  QUALITY_ASSURANCE: "qa",
};

export const ENTERPRISE_WORKSPACES = [
  {
    key: "executive",
    title: "Executive Command Center",
    path: "/dashboard",
    icon: Gauge,
    sidebar: true,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
      ENTERPRISE_ROLES.EXECUTIVE,
    ],
  },
  {
    key: "administration",
    title: "Enterprise Administration",
    path: "/administration",
    icon: Settings,
    sidebar: true,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "survey-studio",
    title: "Survey Studio",
    path: "/survey-builder",
    icon: ClipboardList,
    sidebar: true,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "operations",
    title: "Operations Center",
    path: "/operations",
    icon: Globe2,
    sidebar: true,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
      ENTERPRISE_ROLES.OPERATIONS_MANAGER,
    ],
  },
  {
    key: "intelligence",
    title: "Intelligence Center",
    path: "/intelligence",
    icon: BarChart3,
    sidebar: true,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
      ENTERPRISE_ROLES.STATISTICIAN,
      ENTERPRISE_ROLES.EXECUTIVE,
    ],
  },
  {
    key: "services",
    title: "System Services",
    path: "/system-services",
    icon: Database,
    sidebar: true,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
];

export const ENTERPRISE_PAGES = [
  {
    key: "dashboard",
    title: "Executive Command Center",
    path: "/dashboard",
    workspace: "executive",
    parent: null,
    breadcrumb: "Executive Command Center",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
      ENTERPRISE_ROLES.EXECUTIVE,
    ],
  },

  {
    key: "administration",
    title: "Enterprise Administration",
    path: "/administration",
    workspace: "administration",
    parent: null,
    breadcrumb: "Enterprise Administration",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "enterprise-foundation",
    title: "Enterprise Foundation",
    path: "/administration/enterprise-foundation",
    workspace: "administration",
    parent: "administration",
    breadcrumb: "Enterprise Foundation",
    icon: Building2,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "geographic-master",
    title: "Geographic Master",
    path: "/administration/geography",
    workspace: "administration",
    parent: "administration",
    breadcrumb: "Geographic Master",
    icon: Map,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "enterprise-jobs",
    title: "Enterprise Job Manager",
    path: "/administration/enterprise-jobs",
    workspace: "services",
    parent: "system-services",
    breadcrumb: "Enterprise Job Manager",
    icon: BriefcaseBusiness,
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },

  {
    key: "survey-builder",
    title: "Survey Studio",
    path: "/survey-builder",
    workspace: "survey-studio",
    parent: null,
    breadcrumb: "Survey Studio",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "questionnaire-designer",
    title: "Questionnaire Designer",
    path: "/survey-builder/:surveyId/designer",
    workspace: "survey-studio",
    parent: "survey-builder",
    breadcrumb: "Questionnaire Designer",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
  {
    key: "survey-preview",
    title: "Survey Preview",
    path: "/survey-builder/:surveyId/preview",
    workspace: "survey-studio",
    parent: "survey-builder",
    breadcrumb: "Survey Preview",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },

  {
    key: "operations-center",
    title: "Operations Center",
    path: "/operations",
    workspace: "operations",
    parent: null,
    breadcrumb: "Operations Center",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
      ENTERPRISE_ROLES.OPERATIONS_MANAGER,
    ],
  },
  {
    key: "enumerator-workspace",
    title: "My Field Assignment",
    path: "/enumerator",
    workspace: "operations",
    parent: "operations-center",
    breadcrumb: "My Field Assignment",
    icon: Users,
    roles: [
      ENTERPRISE_ROLES.ENUMERATOR,
    ],
  },
  {
    key: "supervisor-dashboard",
    title: "Field Operations Dashboard",
    path: "/supervisor",
    workspace: "operations",
    parent: "operations-center",
    breadcrumb: "Field Operations Dashboard",
    icon: ShieldCheck,
    roles: [
      ENTERPRISE_ROLES.SUPERVISOR,
      ENTERPRISE_ROLES.OPERATIONS_MANAGER,
      ENTERPRISE_ROLES.ADMIN,
    ],
  },

  {
    key: "intelligence-center",
    title: "Intelligence Center",
    path: "/intelligence",
    workspace: "intelligence",
    parent: null,
    breadcrumb: "Intelligence Center",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
      ENTERPRISE_ROLES.STATISTICIAN,
      ENTERPRISE_ROLES.EXECUTIVE,
    ],
  },

  {
    key: "system-services",
    title: "System Services",
    path: "/system-services",
    workspace: "services",
    parent: null,
    breadcrumb: "System Services",
    roles: [
      ENTERPRISE_ROLES.ADMIN,
    ],
  },
];

export function normalizeEnterpriseRole(role) {
  return String(role || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function resolveEnterpriseRole(user) {
  const role = normalizeEnterpriseRole(
    user?.backendRole ??
      user?.role
  );

  const aliases = {
    admin: ENTERPRISE_ROLES.ADMIN,
    system_administrator:
      ENTERPRISE_ROLES.ADMIN,
    super_admin:
      ENTERPRISE_ROLES.ADMIN,

    enumerator:
      ENTERPRISE_ROLES.ENUMERATOR,

    supervisor:
      ENTERPRISE_ROLES.SUPERVISOR,

    operations_manager:
      ENTERPRISE_ROLES.OPERATIONS_MANAGER,

    statistician:
      ENTERPRISE_ROLES.STATISTICIAN,
    analyst:
      ENTERPRISE_ROLES.STATISTICIAN,
    research_analyst:
      ENTERPRISE_ROLES.STATISTICIAN,

    executive:
      ENTERPRISE_ROLES.EXECUTIVE,
    project_director:
      ENTERPRISE_ROLES.EXECUTIVE,

    qa:
      ENTERPRISE_ROLES.QUALITY_ASSURANCE,
    quality_assurance:
      ENTERPRISE_ROLES.QUALITY_ASSURANCE,
    quality_assurance_officer:
      ENTERPRISE_ROLES.QUALITY_ASSURANCE,
  };

  return aliases[role] ?? ENTERPRISE_ROLES.ADMIN;
}

export function getWorkspacesForRole(user) {
  const role =
    resolveEnterpriseRole(user);

  return ENTERPRISE_WORKSPACES.filter(
    (workspace) =>
      workspace.roles.includes(role)
  );
}

export function getPageByKey(key) {
  return (
    ENTERPRISE_PAGES.find(
      (page) => page.key === key
    ) || null
  );
}

export function getPageByPath(pathname) {
  return (
    ENTERPRISE_PAGES.find(
      (page) => {
        const routePattern =
          page.path.replace(
            /:[^/]+/g,
            "[^/]+"
          );

        const matcher =
          new RegExp(
            `^${routePattern}$`
          );

        return matcher.test(pathname);
      }
    ) || null
  );
}

export function getRoleLandingRoute(user) {
  const role =
    resolveEnterpriseRole(user);

  const landingRoutes = {
    [ENTERPRISE_ROLES.ADMIN]:
      "/dashboard",

    [ENTERPRISE_ROLES.ENUMERATOR]:
      "/enumerator",

    [ENTERPRISE_ROLES.SUPERVISOR]:
      "/supervisor",

    [ENTERPRISE_ROLES.OPERATIONS_MANAGER]:
      "/operations",

    [ENTERPRISE_ROLES.STATISTICIAN]:
      "/intelligence",

    [ENTERPRISE_ROLES.EXECUTIVE]:
      "/dashboard",

    [ENTERPRISE_ROLES.QUALITY_ASSURANCE]:
      "/supervisor",
  };

  return (
    landingRoutes[role] ||
    "/dashboard"
  );
}