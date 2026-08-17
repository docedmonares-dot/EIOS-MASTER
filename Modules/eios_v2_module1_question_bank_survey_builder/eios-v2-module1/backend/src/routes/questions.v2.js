import express from 'express';
import { validateQuestionPayload } from '../validators/questionValidator.js';

const router = express.Router();

router.get('/questions', async (req, res) => {
  const { status, module, search } = req.query;
  const params = [];
  let where = 'WHERE 1=1';

  if (status) { params.push(status); where += ` AND question_status = $${params.length}`; }
  if (module) { params.push(module); where += ` AND question_module = $${params.length}`; }
  if (search) { params.push(`%${search}%`); where += ` AND (question_code ILIKE $${params.length} OR question_text ILIKE $${params.length})`; }

  const result = await req.db.query(`SELECT * FROM question_bank ${where} ORDER BY question_module, question_group, question_code`, params);
  res.json(result.rows);
});

router.post('/questions', async (req, res) => {
  const errors = validateQuestionPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });
  const q = req.body;

  const result = await req.db.query(
    `INSERT INTO question_bank
    (question_code, question_text, question_type, question_group, question_module,
     question_category_id, question_description, question_status, required_flag,
     options_json, metadata_json, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$12)
     RETURNING *`,
    [q.question_code, q.question_text, q.question_type, q.question_group, q.question_module,
     q.question_category_id, q.question_description, q.question_status || 'Draft',
     !!q.required_flag, JSON.stringify(q.options_json || []), JSON.stringify(q.metadata_json || {}),
     req.user?.id || null]
  );

  const created = result.rows[0];

  await req.db.query(
    `INSERT INTO question_versions(question_id, version_number, question_snapshot, change_log, changed_by)
     VALUES ($1,$2,$3::jsonb,$4,$5)`,
    [created.question_id, 1, JSON.stringify(created), 'Initial creation', req.user?.id || null]
  );

  res.status(201).json(created);
});

router.put('/questions/:id', async (req, res) => {
  const errors = validateQuestionPayload(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const oldResult = await req.db.query('SELECT * FROM question_bank WHERE question_id=$1', [req.params.id]);
  if (!oldResult.rowCount) return res.status(404).json({ error: 'Question not found' });

  const old = oldResult.rows[0];
  const q = req.body;
  const version = Number(old.version_number || 1) + 1;

  const result = await req.db.query(
    `UPDATE question_bank SET
     question_code=$1, question_text=$2, question_type=$3, question_group=$4,
     question_module=$5, question_category_id=$6, question_description=$7,
     question_status=$8, required_flag=$9, version_number=$10,
     options_json=$11::jsonb, metadata_json=$12::jsonb,
     updated_by=$13, updated_at=CURRENT_TIMESTAMP
     WHERE question_id=$14 RETURNING *`,
    [q.question_code, q.question_text, q.question_type, q.question_group, q.question_module,
     q.question_category_id, q.question_description, q.question_status || old.question_status,
     !!q.required_flag, version, JSON.stringify(q.options_json || []),
     JSON.stringify(q.metadata_json || {}), req.user?.id || null, req.params.id]
  );

  const updated = result.rows[0];
  await req.db.query(
    `INSERT INTO question_versions(question_id, version_number, question_snapshot, change_log, changed_by)
     VALUES ($1,$2,$3::jsonb,$4,$5)`,
    [updated.question_id, version, JSON.stringify(updated), q.change_log || 'Question updated', req.user?.id || null]
  );

  res.json(updated);
});

router.post('/questions/:id/clone', async (req, res) => {
  const oldResult = await req.db.query('SELECT * FROM question_bank WHERE question_id=$1', [req.params.id]);
  if (!oldResult.rowCount) return res.status(404).json({ error: 'Question not found' });
  const old = oldResult.rows[0];

  const result = await req.db.query(
    `INSERT INTO question_bank
    (question_code, question_text, question_type, question_group, question_module,
     question_category_id, question_description, question_status, required_flag,
     options_json, metadata_json, created_by, updated_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'Draft',$8,$9::jsonb,$10::jsonb,$11,$11)
     RETURNING *`,
    [req.body.question_code || `${old.question_code}_COPY_${Date.now()}`, old.question_text,
     old.question_type, old.question_group, old.question_module, old.question_category_id,
     old.question_description, old.required_flag, JSON.stringify(old.options_json || []),
     JSON.stringify(old.metadata_json || {}), req.user?.id || null]
  );

  res.status(201).json(result.rows[0]);
});

router.patch('/questions/:id/status', async (req, res) => {
  const { status } = req.body;
  if (!['Active','Inactive','Draft','Archived'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const result = await req.db.query(
    `UPDATE question_bank SET question_status=$1, updated_by=$2, updated_at=CURRENT_TIMESTAMP
     WHERE question_id=$3 RETURNING *`,
    [status, req.user?.id || null, req.params.id]
  );

  if (!result.rowCount) return res.status(404).json({ error: 'Question not found' });
  res.json(result.rows[0]);
});

router.delete('/questions/:id', async (req, res) => {
  await req.db.query(`UPDATE question_bank SET question_status='Archived' WHERE question_id=$1`, [req.params.id]);
  res.json({ ok: true, archived: true });
});

export default router;