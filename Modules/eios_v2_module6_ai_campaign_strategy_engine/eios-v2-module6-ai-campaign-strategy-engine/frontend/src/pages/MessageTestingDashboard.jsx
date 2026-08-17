import React, { useState } from 'react';
import { StrategyAPI } from '../services/strategyApi';
import MessageScorePanel from '../components/MessageScorePanel';
import '../module6Strategy.css';

export default function MessageTestingDashboard() {
  const [form, setForm] = useState({
    message_title: '',
    message_theme: '',
    message_text: '',
    target_candidate: '',
    target_issue: '',
    target_segment: ''
  });
  const [result, setResult] = useState(null);

  async function test() {
    const res = await StrategyAPI.messageTest(form);
    setResult(res);
  }

  return (
    <div className="strategy-page">
      <h1>Message Testing Engine</h1>
      <section className="strategy-panel">
        <input placeholder="Message Title" value={form.message_title} onChange={e=>setForm({...form, message_title:e.target.value})}/>
        <input placeholder="Theme" value={form.message_theme} onChange={e=>setForm({...form, message_theme:e.target.value})}/>
        <textarea rows="5" placeholder="Message Text" value={form.message_text} onChange={e=>setForm({...form, message_text:e.target.value})}/>
        <input placeholder="Target Candidate" value={form.target_candidate} onChange={e=>setForm({...form, target_candidate:e.target.value})}/>
        <input placeholder="Target Issue" value={form.target_issue} onChange={e=>setForm({...form, target_issue:e.target.value})}/>
        <input placeholder="Target Segment" value={form.target_segment} onChange={e=>setForm({...form, target_segment:e.target.value})}/>
        <button onClick={test}>Test Message</button>
      </section>
      <MessageScorePanel result={result} />
    </div>
  );
}