# EIOS V2 Module 6 Integration Guide

## Database
Run:

psql -d eios -f database/eios_v2_module6_strategy_schema.sql

## Backend
Copy:
- backend/src/routes/strategy.v2.js
- backend/src/engines/strategyRulesEngine.js
- backend/src/engines/messageTestingEngine.js
- backend/src/engines/resourceAllocationEngine.js
- backend/src/services/strategyMemoService.js

Add:
import strategyV2 from './routes/strategy.v2.js';
app.use('/api/v2', strategyV2);

## Frontend
Copy:
- AICampaignStrategyDashboard.jsx
- MessageTestingDashboard.jsx
- ResourceAllocationDashboard.jsx
- StrategyMemoDashboard.jsx
- StrategyRecommendationCard.jsx
- MessageScorePanel.jsx
- strategyApi.js
- module6Strategy.css

Add menu items:
- AI Campaign Strategy
- Message Testing
- Resource Allocation
- Strategy Memo

## Operational Flow
1. Create strategy session.
2. Generate recommendations from analytics/GIS/QC.
3. Test campaign messages.
4. Generate resource allocation.
5. Register risks.
6. Generate campaign memo.
7. Convert recommendations into action tracker items.
