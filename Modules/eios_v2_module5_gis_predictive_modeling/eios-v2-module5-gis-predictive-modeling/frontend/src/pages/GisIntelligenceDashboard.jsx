import React, { useEffect, useState } from 'react';
import { GisPredictiveAPI } from '../services/gisPredictiveApi';
import GisMapPlaceholder from '../components/GisMapPlaceholder';
import MapLayerPanel from '../components/MapLayerPanel';
import PredictiveScoreCard from '../components/PredictiveScoreCard';
import '../module5Gis.css';

export default function GisIntelligenceDashboard() {
  const [boundaries, setBoundaries] = useState(null);
  const [points, setPoints] = useState([]);
  const [layers, setLayers] = useState([]);
  const [scores, setScores] = useState([]);
  const [areas, setAreas] = useState([]);

  async function load() {
    setBoundaries(await GisPredictiveAPI.boundaries({}));
    setPoints(await GisPredictiveAPI.respondentPoints({}));
    setLayers(await GisPredictiveAPI.layers());
    setScores(await GisPredictiveAPI.predictiveScores());
    setAreas(await GisPredictiveAPI.areaSummary());
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="gis-page">
      <header>
        <h1>EIOS GIS Intelligence Dashboard</h1>
        <p>Spatial field intelligence, electoral geography, hotspots, and predictive modeling.</p>
      </header>

      <div className="gis-grid">
        <GisMapPlaceholder boundaries={boundaries} points={points} />
        <MapLayerPanel layers={layers} />
      </div>

      <section className="gis-panel">
        <h2>Predictive Scores</h2>
        <div className="score-grid">
          {scores.map((s, i) => <PredictiveScoreCard key={i} score={s} />)}
        </div>
      </section>

      <section className="gis-panel">
        <h2>Area Summary</h2>
        <table>
          <thead><tr><th>Area</th><th>Province</th><th>Municipality</th><th>Barangay</th><th>Interviews</th><th>Avg GPS Accuracy</th></tr></thead>
          <tbody>
            {areas.map(a => <tr key={a.boundary_id}>
              <td>{a.boundary_name}</td><td>{a.province}</td><td>{a.municipality}</td><td>{a.barangay}</td>
              <td>{a.interview_count}</td><td>{Math.round(a.avg_gps_accuracy || 0)}m</td>
            </tr>)}
          </tbody>
        </table>
      </section>
    </div>
  );
}