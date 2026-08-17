import { useCallback, useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";

import MainLayout from "../../../layouts/MainLayout";
import { getEnterpriseFieldMap } from "../../../services/fieldMapService";
import "leaflet/dist/leaflet.css";

const PHILIPPINES_CENTER = [12.8797, 121.774];

function coordinates(gps) {
  let value = gps;
  if (typeof value === "string") {
    try { value = JSON.parse(value); } catch { return null; }
  }
  if (Array.isArray(value) && value.length >= 2) {
    const latitude = Number(value[0]);
    const longitude = Number(value[1]);
    return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
  }
  const latitude = Number(value?.latitude ?? value?.lat);
  const longitude = Number(value?.longitude ?? value?.lng ?? value?.lon);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? [latitude, longitude] : null;
}

export default function GisIntelligencePage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setRecords(await getEnterpriseFieldMap());
    } catch (loadError) {
      setError(loadError.message || "Unable to load field map.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const points = useMemo(() => records
    .map((record) => ({ ...record, coordinates: coordinates(record.gps) }))
    .filter((record) => record.coordinates), [records]);

  return (
    <MainLayout>
      <section className="administration-dashboard-page">
        <div className="administration-dashboard-page__header">
          <span className="administration-dashboard-page__overline">GEOSPATIAL INTELLIGENCE</span>
          <h1>GIS Field Intelligence</h1>
          <p>Visualize authorized Enumerator attendance locations and field activity.</p>
        </div>

        <div className="administration-dashboard-page__summary">
          <article><span>Attendance Records</span><strong>{records.length}</strong></article>
          <article><span>Mapped Locations</span><strong>{points.length}</strong></article>
          <article><span>Missing GPS</span><strong>{records.length - points.length}</strong></article>
          <article><span>GIS Status</span><strong className="administration-dashboard-page__online">{error ? "ATTENTION" : "ONLINE"}</strong></article>
        </div>

        {error && <div role="alert" style={{ padding: 14, color: "#991b1b", background: "#fef2f2", borderRadius: 10 }}>{error}</div>}

        <div style={{ marginTop: 20, padding: 16, background: "#fff", borderRadius: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h2>National Field Map</h2>
            <button type="button" onClick={load} disabled={loading}>{loading ? "Loading..." : "Refresh"}</button>
          </div>
          <MapContainer center={points[0]?.coordinates || PHILIPPINES_CENTER} zoom={points.length ? 13 : 5} style={{ height: 430, width: "100%", borderRadius: 12 }}>
            <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {points.map((record) => (
              <CircleMarker key={`${record.enumerator_id}-${record.clock_in_time}`} center={record.coordinates} radius={9} pathOptions={{ color: "#2563eb", fillOpacity: 0.8 }}>
                <Popup><strong>{record.full_name || "Enumerator"}</strong><br />{record.status || "Attendance recorded"}</Popup>
              </CircleMarker>
            ))}
          </MapContainer>
          {!loading && points.length === 0 && <p>No attendance GPS coordinates are currently available.</p>}
        </div>
      </section>
    </MainLayout>
  );
}
