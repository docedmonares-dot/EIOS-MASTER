# EIOS V2 Module 4 Integration Guide

## Database
Run:

psql -d eios -f database/eios_v2_module4_war_room_schema.sql

## Backend
Copy:
- backend/src/routes/warroom.v2.js
- backend/src/services/warRoomKpiService.js
- backend/src/services/warRoomRecommendationService.js
- backend/src/services/reportGeneratorService.js

Add:

import warRoomV2 from './routes/warroom.v2.js';
app.use('/api/v2', warRoomV2);

## Frontend
Copy:
- frontend/src/pages/ExecutiveWarRoom.jsx
- frontend/src/services/warRoomApi.js
- frontend/src/components/*
- frontend/src/warRoom.css

Add a menu item:
Executive War Room

## Operational Flow
1. Open War Room session.
2. Load KPI cards.
3. Review field operations.
4. Review candidate scorecards.
5. Review GIS command map.
6. Review alerts.
7. Generate strategic recommendations.
8. Generate executive brief.
