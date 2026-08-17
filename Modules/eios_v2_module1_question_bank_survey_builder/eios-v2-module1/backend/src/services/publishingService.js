export function freezeQuestionSnapshot(questions) {
  return questions.map(q => ({
    survey_question_id: q.survey_question_id,
    question_id: q.question_id,
    question_code: q.question_code,
    question_text: q.question_text,
    question_type: q.question_type,
    options_json: q.options_json || [],
    required_flag: q.required_override ?? q.required_flag,
    page_number: q.page_number,
    sort_order: q.sort_order,
    section_id: q.section_id,
    settings_json: q.settings_json || {}
  }));
}

export function buildDeploymentPackage({ survey, sections, questions, logic, versionNumber }) {
  return {
    survey_id: survey.survey_id,
    survey_code: survey.survey_code,
    survey_name: survey.survey_name,
    client_id: survey.client_id,
    project_id: survey.project_id,
    wave_id: survey.wave_id,
    election_type: survey.election_type,
    geographic_scope: survey.geographic_scope,
    version_number: versionNumber,
    published_at: new Date().toISOString(),
    sections,
    questions,
    logic,
    enumerator_permissions: {
      can_view: true,
      can_answer: true,
      can_save_draft: true,
      can_final_submit: true,
      can_edit_question: false,
      can_edit_logic: false,
      can_edit_survey: false
    }
  };
}