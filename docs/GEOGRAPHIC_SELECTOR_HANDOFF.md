# Geographic Selector Integration Handoff

## Contract

- Enterprise type code: `GEOGRAPHIC_SELECTOR`
- Response type: `json`
- Answer schema: `eios.geographic-selection.v1`
- Data source: Enterprise Geographic Master
- Question codes are identifiers only and do not control rendering.

## Integrated paths

- Visual Questionnaire Designer toolbox and canvas
- Metadata compiler and published survey snapshots
- Survey Preview runtime
- Deployment packaging and duplicate-safe Enumerator assignment
- Field Interview runtime
- Offline response queue and canonical synchronized responses

## Database migration

Apply:

```text
database/migrations/018_book3_geographic_selector_question_type.sql
```

## Verification

Backend:

```powershell
cd C:\EIOS-MASTER\backend
npm test
```

Frontend:

```powershell
cd C:\EIOS-MASTER\frontend\eios-master-app
npm run test:geographic
npm run build
```

## Source-control note

The Git repository currently starts at `C:\EIOS-MASTER\backend`. The frontend
application and root-level database migrations are outside that repository and
must be included by the workspace's intended source-control strategy before a
single atomic integration commit can be created.
