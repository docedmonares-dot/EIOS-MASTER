import React, { useEffect, useState } from 'react';
import { DashboardAPI, QcGpsAPI } from '../services/eiosModule2Api';

export default function SupervisorMonitoring() {
  const [assignments, setAssignments] = useState([]);
  const [flags, setFlags] = useState([]);
  useEffect(()=>{ DashboardAPI.supervisor().then(setAssignments); QcGpsAPI.flags().then(setFlags); },[]);
  return <div className="page">
    <h1>Supervisor Monitoring</h1>
    <h2>Assignments</h2>
    <pre>{JSON.stringify(assignments, null, 2)}</pre>
    <h2>QC Flags</h2>
    <pre>{JSON.stringify(flags, null, 2)}</pre>
  </div>
}