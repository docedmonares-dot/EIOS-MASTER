import React from 'react';

export default function GisMapPlaceholder({ boundaries, points }) {
  return (
    <div className="gis-map-placeholder">
      <h2>GIS Intelligence Map</h2>
      <p>Integrate Leaflet/Mapbox here. Use /gis/boundaries GeoJSON and /gis/respondent-points.</p>
      <div className="map-stats">
        <span>Boundaries: {boundaries?.features?.length || 0}</span>
        <span>Respondent Points: {points?.length || 0}</span>
      </div>
    </div>
  );
}