import React, { useState } from 'react';
import { StrategyAPI } from '../services/strategyApi';
import '../module6Strategy.css';

export default function StrategyMemoDashboard() {
  const [memo, setMemo] = useState(null);

  async function generate() {
    const recommendations = await StrategyAPI.recommendations();
    const risks = await StrategyAPI.risks();
    const resourcePlan = await StrategyAPI.allocationPlans();
    const result = await StrategyAPI.memo({ recommendations, risks, resourcePlan, messageTests: [] });
    setMemo(result);
  }

  return (
    <div className="strategy-page">
      <h1>AI Campaign Memo Generator</h1>
      <button onClick={generate}>Generate Campaign Memo</button>
      {memo && <pre>{memo.text}</pre>}
    </div>
  );
}