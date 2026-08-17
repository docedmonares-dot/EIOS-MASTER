# EIOS National Cloud Architecture

## Recommended Production Stack
- API: Node.js / NestJS or Express
- Database: PostgreSQL + PostGIS
- Cache/Queue: Redis
- Object Storage: S3-compatible storage
- Frontend: React/Vite
- Authentication: JWT + refresh tokens + device binding
- BI: Power BI / Metabase / Superset
- Maps: Mapbox or Leaflet + PostGIS
- Deployment: Docker + Kubernetes or managed cloud containers

## Scaling Model
- National cloud database
- Regional node synchronization
- Tenant isolation
- Data warehouse refresh jobs
- Read replicas for dashboards
- Queue-based sync for field uploads
