# EIOS V2 Module 5 Integration Guide

## Database
Run:

psql -d eios -f database/eios_v2_module5_gis_predictive_schema.sql

Requires:
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";

## Backend
Copy:
- backend/src/routes/gis-predictive.v2.js
- backend/src/services/gisService.js
- backend/src/services/predictiveModelService.js
- backend/src/services/hotspotService.js

Add:
import gisPredictiveV2 from './routes/gis-predictive.v2.js';
app.use('/api/v2', gisPredictiveV2);

## Frontend
Copy:
- GisIntelligenceDashboard.jsx
- PredictiveModelingDashboard.jsx
- HotspotDashboard.jsx
- GisMapPlaceholder.jsx
- MapLayerPanel.jsx
- PredictiveScoreCard.jsx
- gisPredictiveApi.js
- module5Gis.css

Add menu items:
- GIS Intelligence
- Predictive Modeling
- Hotspots

## Next Enhancement
Replace GisMapPlaceholder with Leaflet or Mapbox using:
GET /gis/boundaries
GET /gis/respondent-points
GET /gis/layers
