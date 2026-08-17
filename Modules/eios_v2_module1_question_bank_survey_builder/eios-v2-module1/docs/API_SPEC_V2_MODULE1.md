# API Spec

Base path: /api/v2

Questions:
GET /questions
POST /questions
PUT /questions/:id
POST /questions/:id/clone
PATCH /questions/:id/status
DELETE /questions/:id

Surveys:
GET /surveys
POST /surveys
PUT /surveys/:id
POST /surveys/:id/sections
POST /surveys/:id/questions
POST /logic
GET /logic?survey_id=
POST /surveys/:id/publish
DELETE /surveys/:id
