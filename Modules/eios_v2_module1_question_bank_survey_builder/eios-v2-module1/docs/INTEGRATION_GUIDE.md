# Integration Guide

## Database
Run:
psql -d eios -f database/eios_v2_module1_schema.sql
psql -d eios -f database/seed_question_categories.sql

## Backend
Copy:
- backend/src/routes/questions.v2.js
- backend/src/routes/surveys.v2.js
- backend/src/services/publishingService.js
- backend/src/validators/questionValidator.js

Add to server:
import questionsV2 from './routes/questions.v2.js';
import surveysV2 from './routes/surveys.v2.js';
app.use('/api/v2', questionsV2);
app.use('/api/v2', surveysV2);

Attach PostgreSQL pool:
app.use((req,res,next)=>{ req.db = pool; next(); });

## Frontend
Copy:
- QuestionBankV2.jsx
- SurveyBuilderV2.jsx
- LogicBuilderV2.jsx
- QuestionForm.jsx
- eiosV2Api.js
- eiosV2Module1.css

Add menu items:
- Question Bank V2
- Survey Builder V2
- Logic Builder V2
