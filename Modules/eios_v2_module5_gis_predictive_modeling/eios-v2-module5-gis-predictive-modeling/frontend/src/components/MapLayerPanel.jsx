import React from 'react';

export default function MapLayerPanel({ layers=[] }) {
  return (
    <div className="gis-panel">
      <h2>Map Layers</h2>
      {layers.map(l => (
        <div className="layer-row" key={l.layer_id}>
          <strong>{l.layer_name}</strong>
          <small>{l.layer_type}</small>
        </div>
      ))}
    </div>
  );
}