import React, { useEffect, useState } from 'react';
import { QuestionBankAPI } from '../services/eiosV2Api';
import QuestionForm from '../components/QuestionForm';
export default function QuestionBankV2(){
  const [questions,setQuestions]=useState([]),[mode,setMode]=useState('list'),[editing,setEditing]=useState(null),[filter,setFilter]=useState({search:'',status:'',module:''});
  async function load(){ setQuestions(await QuestionBankAPI.list(filter)); }
  useEffect(()=>{load()},[]);
  async function saveQuestion(payload){ editing?.question_id ? await QuestionBankAPI.update(editing.question_id,payload) : await QuestionBankAPI.create(payload); setEditing(null); setMode('list'); await load(); }
  async function status(q,s){ await QuestionBankAPI.status(q.question_id,s); await load(); }
  async function clone(q){ await QuestionBankAPI.clone(q.question_id,{question_code:`${q.question_code}_COPY_${Date.now()}`}); await load(); }
  if(mode==='form') return <QuestionForm initial={editing||{}} onSave={saveQuestion} onCancel={()=>{setMode('list');setEditing(null)}}/>;
  return <div className="page"><header><h1>Advanced Question Bank</h1><button onClick={()=>setMode('form')}>+ Add Question</button><button>Import</button><button>Export</button><button>Restore Master</button></header>
    <div className="filters"><input placeholder="Search" value={filter.search} onChange={e=>setFilter({...filter,search:e.target.value})}/><select value={filter.status} onChange={e=>setFilter({...filter,status:e.target.value})}><option value="">All</option><option>Active</option><option>Inactive</option><option>Draft</option><option>Archived</option></select><button onClick={load}>Apply</button></div>
    <table><thead><tr><th>Code</th><th>Module</th><th>Type</th><th>Question</th><th>Status</th><th>Version</th><th>Actions</th></tr></thead><tbody>{questions.map(q=><tr key={q.question_id}><td>{q.question_code}</td><td>{q.question_module}</td><td>{q.question_type}</td><td>{q.question_text}</td><td>{q.question_status}</td><td>v{q.version_number}</td><td><button onClick={()=>{setEditing(q);setMode('form')}}>Edit</button><button onClick={()=>clone(q)}>Clone</button><button onClick={()=>status(q,'Active')}>Activate</button><button onClick={()=>status(q,'Inactive')}>Deactivate</button><button onClick={()=>status(q,'Draft')}>Draft</button><button onClick={()=>status(q,'Archived')}>Archive</button><button>Preview</button><button>Logic</button></td></tr>)}</tbody></table>
  </div>
}