import { useEffect, useState } from "react";

import {
  ChevronRight,
  Globe2,
  LoaderCircle,
  MapPin,
} from "lucide-react";

import {
  getGeographicChildren,
  getGeographicRoots,
} from "../../../services/geographicMasterService";

export default function GeographicHierarchyBrowser() {
  const [roots, setRoots] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadRoots() {
      try {
        setLoading(true);
        setErrorMessage("");

        const data = await getGeographicRoots("PH");

        setRoots(data || []);
      } catch (error) {
        console.error(
          "Geographic roots loading failed:",
          error
        );

        setErrorMessage(
          error.response?.data?.message ||
            error.message ||
            "Unable to load geographic hierarchy."
        );
      } finally {
        setLoading(false);
      }
    }

    loadRoots();
  }, []);

  async function selectUnit(unit) {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getGeographicChildren(
        unit.geo_unit_id
      );

      setSelectedPath((currentPath) => {
        const existingIndex = currentPath.findIndex(
          (item) => item.geo_unit_id === unit.geo_unit_id
        );

        if (existingIndex >= 0) {
          return currentPath.slice(0, existingIndex + 1);
        }

        return [...currentPath, unit];
      });

      setChildren(response?.data || []);
    } catch (error) {
      console.error(
        "Geographic children loading failed:",
        error
      );

      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to load child geographic units."
      );
    } finally {
      setLoading(false);
    }
  }

  function resetHierarchy() {
    setSelectedPath([]);
    setChildren([]);
    setErrorMessage("");
  }

  const visibleUnits =
    selectedPath.length === 0 ? roots : children;

  return (
    <section className="geographic-hierarchy-browser">
      <div className="geographic-hierarchy-browser__header">
        <div>
          <span>Geographic Hierarchy</span>
          <h2>Philippine Administrative Structure</h2>
        </div>

        {selectedPath.length > 0 && (
          <button
            type="button"
            onClick={resetHierarchy}
            className="geographic-hierarchy-browser__reset"
          >
            Back to country
          </button>
        )}
      </div>

      <div className="geographic-hierarchy-browser__breadcrumb">
        <button
          type="button"
          onClick={resetHierarchy}
        >
          Philippines
        </button>

        {selectedPath.map((unit) => (
          <div key={unit.geo_unit_id}>
            <ChevronRight size={15} />

            <button
              type="button"
              onClick={() => selectUnit(unit)}
            >
              {unit.unit_name}
            </button>
          </div>
        ))}
      </div>

      {errorMessage && (
        <div className="enterprise-foundation-state enterprise-foundation-state--error">
          {errorMessage}
        </div>
      )}

      {loading && (
        <div className="geographic-hierarchy-browser__loading">
          <LoaderCircle size={20} />
          Loading geographic units...
        </div>
      )}

      {!loading && visibleUnits.length === 0 && (
        <div className="geographic-hierarchy-browser__empty">
          <MapPin size={28} />

          <strong>No child geographic records yet</strong>

          <span>
            Import the official PSGC dataset to populate this level.
          </span>
        </div>
      )}

      {!loading && visibleUnits.length > 0 && (
        <div className="geographic-hierarchy-browser__grid">
          {visibleUnits.map((unit) => (
            <button
              key={unit.geo_unit_id}
              type="button"
              className="geographic-hierarchy-unit"
              onClick={() => selectUnit(unit)}
            >
              <div className="geographic-hierarchy-unit__icon">
                <Globe2 size={20} />
              </div>

              <div>
                <span>{unit.type_name}</span>
                <strong>{unit.unit_name}</strong>

                <small>
                  {unit.official_code || "No official code"}
                </small>
              </div>

              <ChevronRight size={18} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}