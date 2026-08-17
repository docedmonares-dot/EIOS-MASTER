import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  Gauge,
  Globe2,
  Home,
  Map,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";

import {
  NavLink,
} from "react-router-dom";

import {
  useAuth,
} from "../../modules/authentication/context/AuthContext";

import {
  normalizeRole,
} from "../../modules/authentication/utils/roleLandingRoute";

const MENU_BY_ROLE = {
  admin: [
    {
      label: "Enterprise Dashboard",
      path: "/dashboard",
      icon: Home,
    },
    {
      label: "Administration",
      path: "/administration",
      icon: Settings,
    },
    {
      label: "Survey Engineering",
      path: "/survey-builder",
      icon: ClipboardList,
    },
  ],

  enumerator: [
    {
      label: "My Assignment",
      path: "/enumerator",
      icon: ClipboardCheck,
    },
  ],

  supervisor: [
    {
      label: "Field Operations",
      path: "/supervisor",
      icon: ShieldCheck,
    },
  ],

  operations_manager: [
    {
      label: "Operations Control",
      path: "/deployment",
      icon: Globe2,
    },
    {
      label: "Field Teams",
      path: "/supervisor",
      icon: Users,
    },
  ],

  statistician: [
    {
      label: "Intelligence Center",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      label: "GIS Intelligence",
      path: "/gis",
      icon: Map,
    },
  ],

  executive: [
    {
      label: "Executive Dashboard",
      path: "/dashboard",
      icon: Gauge,
    },
    {
      label: "Operations Overview",
      path: "/deployment",
      icon: Globe2,
    },
    {
      label: "Intelligence",
      path: "/analytics",
      icon: BarChart3,
    },
    {
      label: "GIS",
      path: "/gis",
      icon: Map,
    },
  ],

  qa: [
    {
      label: "Quality Assurance",
      path: "/supervisor",
      icon: ClipboardCheck,
    },
  ],
};

function resolveRoleKey(user) {
  const normalizedRole =
    normalizeRole(
      user?.backendRole ??
        user?.role
    );

  if (
    [
      "admin",
      "system administrator",
      "super_admin",
      "super admin",
    ].includes(normalizedRole)
  ) {
    return "admin";
  }

  if (normalizedRole === "enumerator") {
    return "enumerator";
  }

  if (normalizedRole === "supervisor") {
    return "supervisor";
  }

  if (
    [
      "operations_manager",
      "operations manager",
    ].includes(normalizedRole)
  ) {
    return "operations_manager";
  }

  if (
    [
      "statistician",
      "analyst",
      "research analyst",
    ].includes(normalizedRole)
  ) {
    return "statistician";
  }

  if (
    [
      "executive",
      "project director",
    ].includes(normalizedRole)
  ) {
    return "executive";
  }

  if (
    [
      "qa",
      "quality assurance",
      "quality assurance officer",
    ].includes(normalizedRole)
  ) {
    return "qa";
  }

  return "admin";
}

export default function Sidebar() {
  const {
    user,
  } = useAuth();

  const roleKey =
    resolveRoleKey(user);

  const menus =
    MENU_BY_ROLE[roleKey] ??
    MENU_BY_ROLE.admin;

  return (
    <aside className="eios-sidebar">
      <div className="eios-sidebar__brand">
        <div className="eios-logo">
          EI
        </div>

        <div>
          <h2>EIOS</h2>

          <p>
            {roleKey === "enumerator" &&
              "Enumerator Workspace"}

            {roleKey === "supervisor" &&
              "Field Operations"}

            {roleKey === "operations_manager" &&
              "Operations Control"}

            {roleKey === "statistician" &&
              "Intelligence Center"}

            {roleKey === "executive" &&
              "Executive Command Center"}

            {roleKey === "qa" &&
              "Quality Assurance"}

            {roleKey === "admin" &&
              "Enterprise Command Center"}
          </p>
        </div>
      </div>

      <div className="eios-sidebar__section">
        <span className="eios-sidebar__heading">
          NAVIGATION
        </span>

        <nav className="eios-sidebar__navigation">
          {menus.map((menu) => {
            const Icon =
              menu.icon;

            return (
              <NavLink
                key={menu.path}
                to={menu.path}
                className={({
                  isActive,
                }) =>
                  `eios-sidebar__link${
                    isActive
                      ? " eios-sidebar__link--active"
                      : ""
                  }`
                }
              >
                <Icon
                  size={19}
                  strokeWidth={2}
                />

                <span>
                  {menu.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="eios-sidebar-status">
        <span className="eios-sidebar__heading">
          SYSTEM STATUS
        </span>

        <div className="status-item">
          <span>API</span>

          <span className="status-online">
            ONLINE
          </span>
        </div>

        <div className="status-item">
          <span>Database</span>

          <span className="status-online">
            ONLINE
          </span>
        </div>
      </div>
    </aside>
  );
}
