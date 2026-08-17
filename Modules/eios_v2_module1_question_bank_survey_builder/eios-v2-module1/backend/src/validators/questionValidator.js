export const QUESTION_TYPES = [
  'Short Text','Long Text','Number','Currency','Date','Time',
  'Single Choice','Multiple Choice','Dropdown','Ranking','Likert Scale',
  'Matrix','Candidate Matrix','Issue Matrix','GPS','Photo Capture',
  'QR Code','Digital Signature','File Upload'
];

export const QUESTION_STATUSES = ['Active','Inactive','Draft','Archived'];

export function validateQuestionPayload(body) {
  const errors = [];
  if (!body.question_code) errors.push('question_code is required');
  if (!body.question_text) errors.push('question_text is required');
  if (!body.question_type) errors.push('question_type is required');
  if (body.question_type && !QUESTION_TYPES.includes(body.question_type)) errors.push('Invalid question_type');
  if (body.question_status && !QUESTION_STATUSES.includes(body.question_status)) errors.push('Invalid question_status');
  return errors;
}

export function validateSurveyPayload(body) {
  const errors = [];
  if (!body.survey_code) errors.push('survey_code is required');
  if (!body.survey_name) errors.push('survey_name is required');
  return errors;
}