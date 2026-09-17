# LOUMOO SuperAdmin Control Center

A dedicated, enterprise-grade administrative system and zero-code platform control center for the LOUMOO Universal Commerce Platform.

---

## 1. Structure

```
SuperAdmin/
├── backend/
│   ├── routes/
│   │   └── superAdminRoutes.js        # REST endpoints mounted at /api/v1/admin/* and /api/admin/*
│   ├── controllers/
│   │   ├── SuperAdminOverviewController.js   # Real-time KPIs & audit logs
│   │   ├── SuperAdminSettingsController.js   # Zero-code dynamic settings
│   │   └── SuperAdminStoresController.js     # Stores & KYC moderation endpoints
│   ├── services/
│   │   └── SuperAdminService.js       # Business validations & audit trail generator
│   ├── repositories/
│   │   └── SuperAdminRepository.js    # PostgreSQL iam.system_settings, iam.stores, iam.audit_logs
│   └── middleware/
│       └── superAdminGuard.js         # Strict RBAC guard (super_admin / admin)
└── frontend/
    ├── index.html                     # Dedicated dashboard page with LOUMOO luxury aesthetic
    ├── css/
    │   └── super_admin.css            # Plus Jakarta Sans + Inter, LOUMOO tokens, dark/light cards
    └── js/
        ├── superAdminApi.js           # Client SDK for admin endpoints
        └── superAdminApp.js           # Interactive controller (Tabs, Stores, Settings, Audit)
```

---

## 2. Endpoints

All administrative endpoints are mounted at `/api/v1/admin/*` and require administrative privileges (`admin` or `super_admin` role, or bearer token):

### Web UI
- `GET /superadmin` or `GET /admin`: Serves the dedicated SuperAdmin web application.

### Overview & Metrics
- `GET /api/v1/admin/overview`: Returns live KPIs (GMV, total orders, active stores, pending KYC).

### Stores & Merchant KYC Moderation (Phase 2)
- `GET /api/v1/admin/stores`: List stores with status, tier, and search filters.
- `GET /api/v1/admin/stores/:id`: Deep store inspection with owner profile data.
- `PATCH /api/v1/admin/stores/:id`: Moderate store attributes (phone number, description, visibility).
- `POST /api/v1/admin/stores/:id/verify-kyc`: 1-Click KYC approval (activates store, sets tier, verifies owner).
- `POST /api/v1/admin/stores/:id/reject-kyc`: 1-Click KYC rejection with reason note.
- `POST /api/v1/admin/stores/:id/suspend`: 1-Click store suspension (removes listings from marketplace discovery).
- `POST /api/v1/admin/stores/:id/reactivate`: 1-Click store reactivation.

### Dynamic System Settings (Zero-Code Platform Control - Phase 1)
- `GET /api/v1/admin/settings`: Returns all dynamic system settings.
- `GET /api/v1/admin/settings/:key`: Returns a single setting value.
- `PUT /api/v1/admin/settings/:key`: Updates a setting, validates schema, and writes to `iam.audit_logs`.

### Immutable Audit Logs
- `GET /api/v1/admin/audit-logs`: Returns paginated administrative audit history.

---

## 3. Database Tables

Created in migration `server/infrastructure/database/migrations/012_super_admin_and_platform_settings.sql`:
- **`iam.system_settings`**: Key-value JSONB store for runtime configurations.
- **`iam.audit_logs`**: Tamper-evident audit trail capturing `admin_id`, `action`, `resource_type`, `resource_id`, `old_values`, `new_values`, `ip_address`, and `created_at`.
- **`iam.stores`**: Master boutique entity table with verification tiers and status states.

---

## 4. Verification

Run the test suites:
```bash
# Phase 1: Dynamic Settings & Audit Architecture
node tests/unit/super_admin_phase1.test.js

# Phase 2: Stores & Merchant KYC Moderation Hub
node tests/unit/super_admin_phase2.test.js
```
