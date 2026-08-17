export async function getBoundaryGeoJson(req, filters = {}) {
  const params = [];
  let where = 'WHERE geom IS NOT NULL';

  if (filters.province) {
    params.push(filters.province);
    where += ` AND province = $${params.length}`;
  }
  if (filters.municipality) {
    params.push(filters.municipality);
    where += ` AND municipality = $${params.length}`;
  }
  if (filters.barangay) {
    params.push(filters.barangay);
    where += ` AND barangay = $${params.length}`;
  }

  const result = await req.db.query(
    `SELECT boundary_id, boundary_name, region, province, municipality, barangay,
            ST_AsGeoJSON(geom)::json AS geometry
     FROM gis_boundaries ${where}
     LIMIT 500`,
    params
  );

  return {
    type: 'FeatureCollection',
    features: result.rows.map(r => ({
      type: 'Feature',
      geometry: r.geometry,
      properties: {
        boundary_id: r.boundary_id,
        boundary_name: r.boundary_name,
        region: r.region,
        province: r.province,
        municipality: r.municipality,
        barangay: r.barangay
      }
    }))
  };
}

export async function getRespondentPoints(req, filters = {}) {
  const params = [];
  let where = 'WHERE gps_point IS NOT NULL';

  if (filters.project_id) {
    params.push(filters.project_id);
    where += ` AND project_id = $${params.length}`;
  }
  if (filters.survey_wave_id) {
    params.push(filters.survey_wave_id);
    where += ` AND survey_wave_id = $${params.length}`;
  }

  const result = await req.db.query(
    `SELECT respondent_point_id, respondent_code, qc_status, interview_status,
            ST_Y(gps_point) lat, ST_X(gps_point) lng, gps_accuracy, submitted_at
     FROM respondent_gis_points ${where}
     ORDER BY submitted_at DESC LIMIT 5000`,
    params
  );

  return result.rows;
}

export async function classifyArea({ preference_pct=0, tenacity_pct=0, swing_probability=0 }) {
  if (preference_pct >= 55 && tenacity_pct >= 60) return 'Stronghold';
  if (preference_pct <= 30) return 'Weak Area';
  if (swing_probability >= 50) return 'Swing Area';
  if (preference_pct > 30 && preference_pct < 55) return 'Battleground';
  return 'Unknown';
}