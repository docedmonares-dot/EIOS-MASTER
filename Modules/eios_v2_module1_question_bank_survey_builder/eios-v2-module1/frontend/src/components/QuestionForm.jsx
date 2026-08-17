import React, { useState } from 'react';
const QUESTION_TYPES = ['Short Text','Long Text','Number','Currency','Date','Time','Single Choice','Multiple Choice','Dropdown','Ranking','Likert Scale','Matrix','Candidate Matrix','Issue Matrix','GPS','Photo Capture','QR Code','Digital Signature','File Upload'];
const STATUSES = ['Active','Inactive','Draft','Archived'];
export default function QuestionForm({ initial={}, onSave, onCancel }) {
  const [form,setForm]=useState({question_code:'',question_text:'',question_type:'Single Choice',question_group:'',question_module:'',question_description:'',question_status:'Draft',required_flag:false,options_text:'',change_log:'',...initial});
  const update=(k,v)=>setForm(p=>({...p,[k]:v}));
  function submit(e){
    e.preventDefault();
    onSave({...form, options_json: form.options_text ? form.options_text.split('|').map((x,i)=>({value:x.trim(),label:x.trim(),sort_order:i+1})) : []});
  }
  return <form className="eios-form" onSubmit={submit}>
    <label>Question Code<input value={form.question_code} onChange={e=>update('question_code',e.target.value)} /></label>
    <label>Question Text<textarea rows="4" value={form.question_text} onChange={e=>update('question_text',e.target.value)} /></label>
    <label>Question Type<select value={form.question_type} onChange={e=>update('question_type',e.target.value)}>{QUESTION_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
    <label>Status<select value={form.question_status} onChange={e=>update('question_status',e.target.value)}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
    <label>Module<input value={form.question_module||''} onChange={e=>update('question_module',e.target.value)} /></label>
    <label>Group<input value={form.question_group||''} onChange={e=>update('question_group',e.target.value)} /></label>
    <label>Options<input placeholder="Yes|No|Undecided" value={form.options_text||''} onChange={e=>update('options_text',e.target.value)} /></label>
    <label>Required?<select value={String(form.required_flag)} onChange={e=>update('required_flag',e.target.value==='true')}><option value="true">Required</option><option value="false">Optional</option></select></label>
    <label>Description<textarea rows="2" value={form.question_description||''} onChange={e=>update('question_description',e.target.value)} /></label>
    <button type="submit">Save Question</button><button type="button" onClick={onCancel}>Cancel</button>
  </form>
}