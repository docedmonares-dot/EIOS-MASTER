import { useEffect, useState } from "react";

import MainLayout from "../../../layouts/MainLayout";
import GeographicHierarchyBrowser from "../components/GeographicHierarchyBrowser";
import { getGeographicSummary } from "../../../services/geographicMasterService";

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
            Browse the official PSGC hierarchy used by survey design,
            deployment, field interviews, analytics, and enterprise-wide
            location services.
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

        <GeographicHierarchyBrowser />

      </section>
    </MainLayout>
  );
}
