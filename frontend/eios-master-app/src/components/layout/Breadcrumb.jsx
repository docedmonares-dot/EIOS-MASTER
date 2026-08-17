import { Link, useLocation } from "react-router-dom";

const labelMap = {
    dashboard: "Dashboard",
    projects: "Projects",
    "survey-builder": "Survey Builder",
    deployment: "Deployment",
    enumerator: "Enumerator",
    supervisor: "Supervisor",
    analytics: "Analytics",
    gis: "GIS",
    repository: "Repository",
    administration: "Administration",
};

function formatLabel(segment) {
    return (
        labelMap[segment] ||
        segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase())
    );
}

function Breadcrumb() {
    const location = useLocation();

    const pathSegments = location.pathname
        .split("/")
        .filter(Boolean);

    if (pathSegments.length === 0) {
        return null;
    }

    return (
        <nav
            className="eios-breadcrumb"
            aria-label="Breadcrumb"
        >
            <Link
                to="/dashboard"
                className="eios-breadcrumb__home"
            >
                Dashboard
            </Link>

            {pathSegments
                .filter((segment) => segment !== "dashboard")
                .map((segment, index, filteredSegments) => {
                    const originalIndex = pathSegments.indexOf(segment);

                    const path = `/${pathSegments
                        .slice(0, originalIndex + 1)
                        .join("/")}`;

                    const isLast =
                        index === filteredSegments.length - 1;

                    return (
                        <span
                            className="eios-breadcrumb__item"
                            key={`${segment}-${index}`}
                        >
                            <span
                                className="eios-breadcrumb__separator"
                                aria-hidden="true"
                            >
                                /
                            </span>

                            {isLast ? (
                                <span
                                    className="eios-breadcrumb__current"
                                    aria-current="page"
                                >
                                    {formatLabel(segment)}
                                </span>
                            ) : (
                                <Link
                                    to={path}
                                    className="eios-breadcrumb__link"
                                >
                                    {formatLabel(segment)}
                                </Link>
                            )}
                        </span>
                    );
                })}
        </nav>
    );
}

export default Breadcrumb;