# EIOS V2 Module 2 API Spec

Base path: /api/v2

## Personnel
GET /personnel
POST /personnel
PUT /personnel/:id
PATCH /personnel/:id/status

## Deployments
GET /deployments
POST /deployments
PUT /deployments/:id
PATCH /deployments/:id/status
POST /deployments/:id/assign-survey
POST /deployments/:id/assign-personnel
POST /deployments/:id/assign-area

## Enumerator
GET /enumerator/assignments
GET /enumerator/active-survey
GET /enumerator/quota
POST /enumerator/draft
POST /enumerator/final-submit

## Sync
POST /sync/responses
GET /sync/status
POST /sync/retry

## GPS
POST /gps/validate
GET /gps/coverage

## QC
POST /qc/precheck
GET /qc/flags
POST /qc/review

## Dashboards
GET /dashboard/operations
GET /dashboard/supervisor
GET /dashboard/enumerator
