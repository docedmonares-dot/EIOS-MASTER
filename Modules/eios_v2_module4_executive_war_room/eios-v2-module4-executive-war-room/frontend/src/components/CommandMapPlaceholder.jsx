import React from 'react';

export default function CommandMapPlaceholder({ layers=[] }) {
  return (
    <div className="command-map">
      <h2>GIS Command Map</h2>
      <p>Map layer placeholder. Integrate with Leaflet/Mapbox and PostGIS geometry endpoints.</p>
      <ul>
        {layers.map(l => <li key={l.layer_id}>{l.layer_type}: {l.layer_name}</li>)}
      </ul>
    </div>
  );
}