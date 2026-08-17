# EIOS V2 Module 2 Integration Guide

## Database

Run:

```bash
psql -d eios -f database/eios_v2_module2_schema.sql
```

Requires:

```sql
CREATE EXTENSION postgis;
CREATE EXTENSION "uuid-ossp";
```

## Backend

Copy routes:

- personnel.v2.js
- deployments.v2.js
- enumerator.v2.js
- sync.v2.js
- gps-qc-dashboard.v2.js

Copy services:

- fieldLogService.js
- gpsValidationService.js
- qcPrecheckService.js
- syncService.js

Copy validator:

- deploymentValidator.js

Add routes:

```js
app.use('/api/v2', personnelV2);
app.use('/api/v2', deploymentsV2);
app.use('/api/v2', enumeratorV2);
app.use('/api/v2', syncV2);
app.use('/api/v2', gpsQcDashboardV2);
```

## Frontend

Copy:

- eiosModule2Api.js
- indexedDbEngine.js
- syncClient.js
- PersonnelManagement.jsx
- DeploymentManager.jsx
- AreaAssignment.jsx
- EnumeratorMobileDashboard.jsx
- EnumeratorSurveyScreen.jsx
- SyncCenter.jsx
- OperationsDashboard.jsx
- SupervisorMonitoring.jsx
- manifest.json
- service-worker.js
- eiosModule2.css

## Field Pilot Flow

1. Create personnel.
2. Create deployment.
3. Assign published survey version from Module 1.
4. Assign personnel to deployment.
5. Assign area and quota.
6. Enumerator logs in.
7. Enumerator loads assignment and published survey.
8. Enumerator collects offline.
9. Enumerator final submits and locks record.
10. Enumerator syncs when online.
11. Supervisor reviews QC flags.
12. Operations Manager monitors dashboard.
