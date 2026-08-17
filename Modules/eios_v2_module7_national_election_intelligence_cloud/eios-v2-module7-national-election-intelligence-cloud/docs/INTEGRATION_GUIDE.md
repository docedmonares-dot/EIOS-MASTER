# EIOS V2 Module 7 Integration Guide

## Database
Run:

psql -d eios_cloud -f database/eios_v2_module7_national_cloud_schema.sql

## Backend
Copy:
- national-cloud.v2.js
- tenantService.js
- nationalKpiService.js
- cloudSyncService.js
- dataWarehouseService.js
- nationalSecurityService.js

Add:
import nationalCloudV2 from './routes/national-cloud.v2.js';
app.use('/api/v2', nationalCloudV2);

## Frontend
Copy:
- NationalCommandDashboard.jsx
- TenantAdminDashboard.jsx
- RegionalNodeDashboard.jsx
- NationalGeographyDashboard.jsx
- NationalKpiCard.jsx
- RegionalNodePanel.jsx
- NationalAlertPanel.jsx
- nationalCloudApi.js
- nationalCloud.css

Add menu items:
- National Command
- Tenant Admin
- Regional Nodes
- National Geography

## Operational Flow
1. Create tenant.
2. Create election cycle.
3. Create national project.
4. Load national geography.
5. Register regional nodes.
6. Sync regional data upward.
7. Refresh warehouse.
8. Monitor national command dashboard.
