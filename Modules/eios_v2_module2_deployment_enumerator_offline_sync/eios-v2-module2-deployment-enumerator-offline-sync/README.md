# EIOS V2 Module 2
## Deployment Manager, Personnel Assignment, Enumerator App, and Offline Synchronization Engine

This package adds the field operations layer of EIOS V2.

Included:
- PostgreSQL/PostGIS database schema
- Personnel and deployment tables
- Area assignment and quota management
- Enumerator device registration
- Offline response queue
- Sync engine
- GPS validation
- QC precheck
- Field operation logs
- Supervisor review structure
- Backend API routes and services
- React frontend screens
- IndexedDB offline engine
- PWA manifest and service worker scaffold

Integration target:
EIOS V2 Module 1 — Advanced Question Bank and Survey Builder

Doctrine:
The Enumerator collects only assigned data.
The system validates field integrity.
The Supervisor controls quality.
The Operations Manager controls deployment.
The Analyst sees approved intelligence.
The Client sees validated results only.
