import { useEffect, useState } from "react";

import {
  BarChart3,
  Database,
  FileUp,
  Globe2,
  Layers3,
  Map,
  Network,
  Search,
  ShieldCheck,
} from "lucide-react";

import MainLayout from "../../../layouts/MainLayout";
import GeographicHierarchyBrowser from "../components/GeographicHierarchyBrowser";
import { getGeographicSummary } from "../../../services/geographicMasterService";

const geographicModules = [
  {
    title: "Geographic Overview",
    description:
      "View countries, geographic unit types, official units, and operational areas.",
    icon: Globe2,
  },
  {
    title: "PSGC Import Center",
    description:
      "Import and validate official Philippine Standard Geographic Code datasets.",
    icon: FileUp,
  },
  {
    title: "Hierarchy Browser",
    description:
      "Browse the parent-child structure from country to barangay and local operational areas.",
    icon: Network,
  },
  {
    title: "Geographic Search",
    description:
      "Search official units using names, aliases, codes, classifications, and hierarchy.",
    icon: Search,
  },
  {
    title: "Operational Groups",
    description:
      "Create survey areas, deployment zones, research clusters, and custom geographic groupings.",
    icon: Layers3,
  },
  {
    title: "GIS Layers",
    description:
      "Manage coordinates, boundaries, polygons, centroids, maps, and geographic overlays.",
    icon: Map,
  },
  {
    title: "Geographic Intelligence",
    description:
      "Maintain demographic, household, electoral, economic, environmental, and risk indicators.",
    icon: BarChart3,
  },
  {
    title: "Data Validation",
    description:
      "Detect duplicate codes, missing parents, invalid hierarchy levels, and inconsistent records.",
    icon: ShieldCheck,
  },
  {
    title: "Geographic Services",
    description:
      "Monitor PGIE APIs, lookup services, coverage validation, and integration readiness.",
    icon: Database,
  },
];

export default function GeographicMasterPage() {
  const [summary, setSummary] = useState({
    country: null,
    total_unit_types: 0,
    total_geographic_units: 0,
    total_official_units: 0,
    total_operational_groups: 0,
    executive_integration: "Checking",
  });

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadGeographicSummary() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getGeographicSummary();

        setSummary({
          country: data?.country || null,
          total_unit_types: data?.total_unit_types ?? 0,
          total_geographic_units:
            data?.total_geographic_units ?? 0,
          total_official_units:
            data?.total_official_units ?? 0,
          total_operational_groups:
            data?.total_operational_groups ?? 0,
          executive_integration:
            data?.executive_integration || "Connected",
        });
      } catch (error) {
        console.error(
          "Geographic summary loading failed:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load geographic summary."
        );
      } finally {
        setLoading(false);
      }
    }

    loadGeographicSummary();
  }, []);

  return (
    <MainLayout>
      <section className="geographic-master-page">
        <div className="geographic-master-page__header">
          <span className="geographic-master-page__overline">
            Book II · Title III
          </span>

          <h1>Philippine Geographic Intelligence Engine</h1>

          <p>
            Central geographic administration for official PSGC data,
            operational areas, GIS layers, geographic intelligence,
            and enterprise-wide location services.
          </p>
        </div>

        {errorMessage && (
          <div className="enterprise-foundation-state enterprise-foundation-state--error">
            {errorMessage}
          </div>
        )}

        <div className="geographic-master-page__summary">
          <article>
            <span>Country</span>

            <strong>
              {loading
                ? "Loading..."
                : summary.country?.country_name || "Not configured"}
            </strong>
          </article>

          <article>
            <span>Unit Types</span>

            <strong>
              {loading ? "..." : summary.total_unit_types}
            </strong>
          </article>

          <article>
            <span>Geographic Records</span>

            <strong>
              {loading
                ? "..."
                : summary.total_geographic_units}
            </strong>
          </article>

          <article>
            <span>Executive Integration</span>

            <strong className="geographic-master-page__connected">
              {loading
                ? "Checking"
                : summary.executive_integration}
            </strong>
          </article>
        </div>

        <div className="geographic-master-page__summary">
          <article>
            <span>Official Geographic Units</span>

            <strong>
              {loading ? "..." : summary.total_official_units}
            </strong>
          </article>

          <article>
            <span>Operational Groups</span>

            <strong>
              {loading
                ? "..."
                : summary.total_operational_groups}
            </strong>
          </article>
        </div>

        <div className="geographic-master-page__grid">
          {geographicModules.map((module) => {
            const Icon = module.icon;

            return (
              <article
                key={module.title}
                className="geographic-master-card"
              >
                <div className="geographic-master-card__icon">
                  <Icon size={24} />
                </div>

                <div>
                  <h2>{module.title}</h2>

                  <p>{module.description}</p>

                  <span>Coming next</span>
                </div>
              </article>
            );
          })}
        </div>
<GeographicHierarchyBrowser />

      </section>
    </MainLayout>
  );
}