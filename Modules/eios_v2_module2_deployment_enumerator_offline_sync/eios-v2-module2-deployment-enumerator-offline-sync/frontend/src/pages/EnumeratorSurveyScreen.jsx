import React, { useEffect, useState } from 'react';
import { putRecord } from '../offline/indexedDbEngine';

export default function EnumeratorSurveyScreen({ deploymentId, surveyVersionId, enumeratorId, deviceId, questions=[] }) {
  const [answers, setAnswers] = useState({});
  const [gps, setGps] = useState(null);
  const [startTime] = useState(new Date().toISOString());

  function captureGps() {
    navigator.geolocation.getCurrentPosition(pos => {
      setGps({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
        timestamp: new Date().toISOString()
      });
    }, err => alert(err.message), { enableHighAccuracy:true, timeout:15000 });
  }

  async function saveDraft() {
    const local_response_id = answers.local_response_id || `LOCAL-${Date.now()}`;
    await putRecord('responses', {
      local_response_id,
      local_device_id: deviceId,
      enumerator_id: enumeratorId,
      deployment_id: deploymentId,
      survey_version_id: surveyVersionId,
      respondent_code: answers.respondent_code || `R-${Date.now()}`,
      answers,
      gps,
      qc_precheck_json: {},
      sync_status: 'Draft',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    alert('Draft saved offline.');
  }

  async function finalSubmit() {
    if (!confirm('Final na po ba ang sagot ng respondent?')) return;
    const endTime = new Date();
    const start = new Date(startTime);
    const local_response_id = answers.local_response_id || `LOCAL-${Date.now()}`;

    await putRecord('responses', {
      local_response_id,
      local_device_id: deviceId,
      enumerator_id: enumeratorId,
      deployment_id: deploymentId,
      survey_version_id: surveyVersionId,
      respondent_code: answers.respondent_code || `R-${Date.now()}`,
      answers,
      gps,
      start_time: startTime,
      end_time: endTime.toISOString(),
      duration_seconds: Math.round((endTime - start) / 1000),
      final_locked: true,
      qc_precheck_json: {},
      sync_status: 'Final Locked Unsynced',
      retry_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    alert('Final submitted and locked offline. Sync when online.');
  }

  return <div className="mobile-page">
    <h1>Enumerator Survey</h1>
    <button onClick={captureGps}>Capture GPS</button>
    {gps && <p>GPS: {gps.lat}, {gps.lng} ± {Math.round(gps.accuracy)}m</p>}
    <input placeholder="Respondent Code" onChange={e=>setAnswers({...answers, respondent_code:e.target.value})}/>
    {questions.map(q => <div className="question-card" key={q.question_id}>
      <b>{q.question_code}. {q.question_text}</b>
      <input placeholder="Answer" onChange={e=>setAnswers({...answers, [q.question_id]:e.target.value})}/>
    </div>)}
    <button onClick={saveDraft}>Save Draft</button>
    <button onClick={finalSubmit}>Final Submit</button>
  </div>
}