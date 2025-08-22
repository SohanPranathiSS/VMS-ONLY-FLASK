# Admin Backend (Flask)

Runs a minimal admin API on http://localhost:4200 using the existing vms_db schema.

- Auth:
  - Login: `POST /api/admin/login` with `{ email, password }` reads from `admin_users`.
  - App endpoints expect a Bearer JWT with fields: `id, email, role, permissions` (issued by login).
- Endpoints (non-exhaustive):
  - GET /health
  - POST /api/admin/login
  - GET /api/admin/overview (admin)
  - GET /api/admin/users (admin + users:view)
  - GET /api/admin/visits (admin/ops/support/readonly)
  - GET /api/admin/companies (admin/ops/readonly)
  - GET /api/admin/subscriptions (admin/ops/finance/readonly)
  - GET /api/admin/payments (billing:view)
  - GET /api/admin/support (admin/support/ops/readonly)
  - PUT /api/admin/support/:id (support:edit)
  - GET /api/admin/system-settings (admin/super_admin)
  - PUT /api/admin/system-settings (admin/super_admin)
  - GET /api/admin/company-settings (admin/ops)
  - PUT /api/admin/company-settings (admin/ops)
  - GET /api/admin/pricing-plans
  - GET /api/admin/audit-logs

Env vars (copy .env.example to .env): DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, ALLOWED_ORIGINS, FRONTEND_URL.

## Seeding predefined admin users

Seed a predefined set of admin-portal users. The script is idempotent and requires the `admin_users` table to exist (apply `database/init.sql`).

PowerShell steps:

```
cd "Admin Portal/admin-backend"
python -m pip install -r requirements.txt
python .\scripts\seed_admins.py
```

Users seeded (emails/passwords):
- platform.admin@pranathiss.local / admin123$   (admin, permissions: *)
- ops.admin@pranathiss.local / ops123@         (ops)
- finance.admin@pranathiss.local / finance123! (finance)
- support.agent@pranathiss.local / support123  (support)
- readonly.viewer@pranathiss.local / test123   (readonly)
