# Admin Portal for Visitor Management SaaS

This adds an internal Admin Portal (frontend + backend) that works with your existing vms_db schema.

Structure:
- admin-backend (Flask API on port 4200)
- admin-frontend (React + PrimeReact on port 4300)

Quick start (Windows PowerShell):
1) Backend
   - Create Admin Portal/admin-backend/.env (copy from .env.example) and set DB_*, JWT_SECRET, ALLOWED_ORIGINS=http://localhost:4300
   - Install deps: pip install -r requirements.txt
   - Run: python app.py
2) Frontend
   - cd admin-frontend
   - npm install
   - npm start (opens http://localhost:4300)

Auth:
- Use the admin portal login page to authenticate against `/api/admin/login` using users from `admin_users` table.
- The frontend stores the JWT as `localStorage['jwt_token']` and uses it in Authorization headers.

Predefined Admin Users (local dev):
If you applied `database/init.sql` and/or ran the seed script, you can use these credentials:
- platform.admin@pranathiss.local / admin123$   (role: admin)
- ops.admin@pranathiss.local        / ops123@    (role: ops)
- finance.admin@pranathiss.local    / finance123! (role: finance)
- support.agent@pranathiss.local    / support123  (role: support)
- readonly.viewer@pranathiss.local  / test123     (role: readonly)
