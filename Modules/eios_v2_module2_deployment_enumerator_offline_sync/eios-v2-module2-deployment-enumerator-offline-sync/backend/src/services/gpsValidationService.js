export async function validateGps(req, {
  assignment_id,
  personnel_id,
  deployment_id,
  local_response_id,
  lat,
  lng,
  accuracy,
  max_accuracy = 50
}) {
  if (!lat || !lng) {
    return {
      inside_assigned_area: false,
      gps_accuracy_passed: false,
      distance_from_area: null,
      gps_validation_status: 'Missing',
      gps_validation_flags: ['Missing GPS']
    };
  }

  const assignmentResult = await req.db.query(
    `SELECT * FROM area_assignments WHERE assignment_id=$1`,
    [assignment_id]
  );

  const flags = [];
  let inside = true;
  let distance = 0;

  if (Number(accuracy || 9999) > Number(max_accuracy)) {
    flags.push('Weak GPS Accuracy');
  }

  if (assignmentResult.rowCount) {
    const a = assignmentResult.rows[0];

    if (a.gps_polygon) {
      const result = await req.db.query(
        `SELECT ST_Contains(gps_polygon, ST_SetSRID(ST_MakePoint($1,$2),4326)) inside,
                ST_Distance(gps_polygon::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) distance
         FROM area_assignments WHERE assignment_id=$3`,
        [lng, lat, assignment_id]
      );
      inside = !!result.rows[0]?.inside;
      distance = Number(result.rows[0]?.distance || 0);
    }

    if (a.gps_radius_center && a.gps_radius_meters) {
      const result = await req.db.query(
        `SELECT ST_DWithin(gps_radius_center::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography, gps_radius_meters) inside,
                ST_Distance(gps_radius_center::geography, ST_SetSRID(ST_MakePoint($1,$2),4326)::geography) distance
         FROM area_assignments WHERE assignment_id=$3`,
        [lng, lat, assignment_id]
      );
      inside = !!result.rows[0]?.inside;
      distance = Number(result.rows[0]?.distance || 0);
    }
  }

  if (!inside) flags.push('Out of Area');

  const status = !lat || !lng
    ? 'Missing'
    : !inside
      ? 'Out of Area'
      : flags.length
        ? 'Warning'
        : 'Valid';

  await req.db.query(
    `INSERT INTO gps_validation_logs
     (deployment_id, assignment_id, personnel_id, local_response_id, gps_point,
      gps_accuracy, inside_assigned_area, gps_accuracy_passed, distance_from_area,
      gps_validation_status, gps_validation_flags)
     VALUES ($1,$2,$3,$4,ST_SetSRID(ST_MakePoint($5,$6),4326),$7,$8,$9,$10,$11,$12::jsonb)`,
    [
      deployment_id, assignment_id, personnel_id, local_response_id,
      lng, lat, accuracy, inside, Number(accuracy || 9999) <= Number(max_accuracy),
      distance, status, JSON.stringify(flags)
    ]
  );

  return {
    inside_assigned_area: inside,
    gps_accuracy_passed: Number(accuracy || 9999) <= Number(max_accuracy),
    distance_from_area: distance,
    gps_validation_status: status,
    gps_validation_flags: flags
  };
}