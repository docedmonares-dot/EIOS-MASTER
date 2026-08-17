import React, { useEffect, useState } from 'react';
import { DashboardAPI } from '../services/eiosModule2Api';

export default function OperationsDashboard() {
  const [data, setData] = useState(null);
  useEffect(()=>{ DashboardAPI.operations().then(setData); },[]);
  if (!data) return <p>Loading...</p>;

  return <div className="page">
    <h1>Operations Dashboard</h1>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
}