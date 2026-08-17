import React, { useEffect, useState } from 'react';
import { StrategyAPI } from '../services/strategyApi';
import '../module6Strategy.css';

export default function ResourceAllocationDashboard() {
  const [plans, setPlans] = useState([]);

  async function load() { setPlans(await StrategyAPI.allocationPlans()); }
  useEffect(()=>{ load(); },[]);

  async function generate() {
    await StrategyAPI.resourceAllocation({
      totalBudget: 100,
      totalFieldTeams: 10,
      areas: [
        { area_name:'Barangay 1', swing_probability:80, risk_level:'High', estimated_votes:1200 },
        { area_name:'Barangay 2', swing_probability:55, risk_level:'Medium', estimated_votes:900 },
        { area_name:'Barangay 3', swing_probability:20, risk_level:'Low', estimated_votes:700 }
      ]
    });
    await load();
  }

  return (
    <div className="strategy-page">
      <h1>Campaign Resource Allocation</h1>
      <button onClick={generate}>Generate Allocation Plan</button>
      <table>
        <thead><tr><th>Area</th><th>Segment</th><th>Resource</th><th>Quantity</th><th>Priority</th><th>Rationale</th></tr></thead>
        <tbody>{plans.map(p => <tr key={p.allocation_id}>
          <td>{p.target_area}</td><td>{p.target_segment}</td><td>{p.resource_type}</td>
          <td>{p.recommended_quantity}</td><td>{p.priority}</td><td>{p.rationale}</td>
        </tr>)}</tbody>
      </table>
    </div>
  );
}