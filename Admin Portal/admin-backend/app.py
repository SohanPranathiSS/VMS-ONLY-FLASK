import os
import json
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
import jwt
from datetime import datetime, timedelta, timezone
import mysql.connector
import logging
from werkzeug.security import check_password_hash, generate_password_hash
import re
try:
    import bcrypt  # for verifying $2b$ style hashes
except Exception:
    bcrypt = None

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("admin-backend")

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('JWT_SECRET', 'change-me')

allowed_origins = os.getenv('ALLOWED_ORIGINS', 'http://localhost:4300').split(',')
allowed_origins = [o.strip() for o in allowed_origins if o.strip()]
CORS(app, origins=allowed_origins, supports_credentials=True)

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'vms_db')
}

# Build fallback configurations similar to main backend
_hosts = [
    DB_CONFIG.get('host') or 'localhost',
    'localhost',
    '127.0.0.1',
    'mysql',
    'database'
]
_passwords = [DB_CONFIG.get('password') or '', 'root']
DB_FALLBACK_CONFIGS = []
for h in _hosts:
    for p in _passwords:
        cfg = dict(DB_CONFIG)
        cfg['host'] = h
        cfg['password'] = p
        DB_FALLBACK_CONFIGS.append(cfg)

# Simple DB helper

def get_db():
    last_err = None
    for cfg in DB_FALLBACK_CONFIGS:
        try:
            conn = mysql.connector.connect(**{k: v for k, v in cfg.items()})
            if conn.is_connected():
                if cfg is not DB_CONFIG:
                    logger.info(f"DB connected using fallback host={cfg['host']} user={cfg['user']} pwd={'set' if cfg['password'] else 'empty'}")
                return conn
        except Exception as e:
            last_err = e
            continue
    logger.error(f"All DB connection attempts failed. Tried hosts: {list(set([c['host'] for c in DB_FALLBACK_CONFIGS]))}")
    if last_err:
        raise last_err
    raise Exception("Database connection failed")

# Ensure pricing plan features table exists (idempotent)
def ensure_pricing_features_table(conn):
    try:
        cur = conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS pricing_plan_features (
                id INT AUTO_INCREMENT PRIMARY KEY,
                plan_id INT NOT NULL,
                feature_name VARCHAR(255) NOT NULL,
                is_included BOOLEAN DEFAULT TRUE,
                display_order INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_plan_id (plan_id),
                CONSTRAINT fk_ppf_plan FOREIGN KEY (plan_id) REFERENCES pricing_plans(id) ON DELETE CASCADE
            )
            """
        )
        conn.commit()
        cur.close()
    except Exception as e:
        # Log but don't fail the request; endpoints may handle absence differently
        logger.warning(f"ensure_pricing_features_table error: {e}")

# Ensure pricing_plans.billing_cycle supports 'yearly'
def ensure_pricing_cycle_enum(conn):
    try:
        cur = conn.cursor()
        cur.execute("SHOW COLUMNS FROM pricing_plans LIKE 'billing_cycle'")
        row = cur.fetchone()
        if row and len(row) >= 2:
            # row[1] is Type like "enum('monthly')" or "enum('monthly','yearly')"
            type_str = str(row[1]).lower()
            if "yearly" not in type_str:
                cur.execute("""
                    ALTER TABLE pricing_plans
                    MODIFY billing_cycle ENUM('monthly','yearly') NOT NULL DEFAULT 'monthly'
                """)
                conn.commit()
        cur.close()
    except Exception as e:
        logger.warning(f"ensure_pricing_cycle_enum error: {e}")

# Auth helpers

def _has_role(user_role, allowed):
    if not allowed:
        return True
    if user_role in allowed:
        return True
    # Treat 'admin' as elevated for now
    return user_role == 'admin'

def require_roles(*roles):
    def wrapper(fn):
        def inner(*args, **kwargs):
            token = None
            auth = request.headers.get('Authorization')
            if auth and auth.startswith('Bearer '):
                token = auth.split(' ')[1]
            if not token:
                return jsonify({'message': 'Missing token'}), 401
            try:
                # First try real JWT
                data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
                role = data.get('role')
                if roles and not _has_role(role, roles):
                    return jsonify({'message': 'Forbidden'}), 403
                request.current_user = data
            except Exception as e:
                # Dev fallback: token might be base64 of JSON
                try:
                    import base64, json
                    decoded = base64.b64decode(token).decode('utf-8')
                    data = json.loads(decoded)
                    role = data.get('role', 'admin')
                    if roles and not _has_role(role, roles):
                        return jsonify({'message': 'Forbidden'}), 403
                    request.current_user = data
                except Exception:
                    return jsonify({'message': 'Invalid token'}), 401
            return fn(*args, **kwargs)
        inner.__name__ = fn.__name__
        return inner
    return wrapper
# Permission check decorator
def require_perm(permission: str):
    def wrapper(fn):
        def inner(*args, **kwargs):
            user = getattr(request, 'current_user', None)
            if not user:
                return jsonify({'message': 'Unauthorized'}), 401
            perms = user.get('permissions')
            if perms == '*' or (isinstance(perms, list) and (permission in perms or '*' in perms)):
                return fn(*args, **kwargs)
            return jsonify({'message': 'Forbidden: missing permission'}), 403
        inner.__name__ = fn.__name__
        return inner
    return wrapper

# Admin login using admin_users table (separate from tenant users)
@app.post('/api/admin/login')
def admin_login():
    try:
        import json as _json
        ct = request.headers.get('Content-Type')
        raw_len = len(request.data or b'')
        logger.info(f"/api/admin/login request: ct={ct}, raw_len={raw_len}")

        data = request.get_json(silent=True)
        if not isinstance(data, dict):
            data = None
        if data is None:
            # Try raw body
            try:
                body = (request.data or b'').decode('utf-8')
                data = _json.loads(body) if body else {}
            except Exception:
                data = {}
        if not data and request.form:
            data = { 'email': request.form.get('email', ''), 'password': request.form.get('password', '') }

        logger.info(f"/api/admin/login parsed body keys: {list(data.keys()) if isinstance(data, dict) else type(data)}")
        email = (data.get('email') or '').strip()
        password = str(data.get('password') or '')
        if not email or not password:
            return jsonify({'message': 'Email and password are required'}), 400

        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM admin_users WHERE email = %s AND is_active = 1 LIMIT 1", (email,))
        admin = cur.fetchone(); cur.close(); conn.close()
        if not admin:
            return jsonify({'message': 'Invalid credentials'}), 401

        stored = str(admin.get('password') or '')
        ok = False
        try:
            if stored.startswith('$2a$') or stored.startswith('$2b$') or stored.startswith('$2y$'):
                if not bcrypt:
                    raise RuntimeError('bcrypt module not installed')
                ok = bcrypt.checkpw(password.encode('utf-8'), stored.encode('utf-8'))
            else:
                ok = check_password_hash(stored, password)
        except Exception as ve:
            logger.error(f"Password verify error for {email}: {ve}")
            return jsonify({'message': 'Login failed'}), 500
        if not ok:
            return jsonify({'message': 'Invalid credentials'}), 401

        # Normalize permissions
        perms = []
        try:
            rawp = admin.get('permissions')
            if rawp is None:
                perms = []
            elif isinstance(rawp, (list, tuple)):
                perms = list(rawp)
            elif isinstance(rawp, (bytes, bytearray)):
                perms = _json.loads(rawp.decode('utf-8'))
            elif isinstance(rawp, str):
                s = rawp.strip()
                perms = _json.loads(s) if (s.startswith('[') or s.startswith('{') or s.startswith('"')) else []
            else:
                perms = list(rawp) if hasattr(rawp, '__iter__') else []
        except Exception as pe:
            logger.warning(f"permissions parse error for {email}: {pe}")
            perms = []

        token = jwt.encode({
            'id': int(admin['id']),
            'email': admin['email'],
            'role': admin['role'],
            'permissions': perms or '*',
            'admin_portal': True,
            'exp': datetime.now(timezone.utc) + timedelta(hours=12)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        return jsonify({'token': token, 'user': {'id': admin['id'], 'name': admin['name'], 'email': admin['email'], 'role': admin['role'], 'permissions': perms}})
    except Exception:
        logger.exception("Admin login error")
        return jsonify({'message': 'Login failed'}), 500

# --- Forgot Password (Email verification + reset) ---
@app.post('/api/admin/forgot-password/verify')
def admin_forgot_verify():
    """Verify if an admin email exists and is active. Public endpoint."""
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip()
        if not email:
            return jsonify({ 'message': 'Email is required' }), 400
        conn = get_db(); cur = conn.cursor()
        cur.execute("SELECT id FROM admin_users WHERE email = %s AND is_active = 1 LIMIT 1", (email,))
        row = cur.fetchone(); cur.close(); conn.close()
        if not row:
            return jsonify({ 'message': 'Email not found' }), 404
        return jsonify({ 'ok': True })
    except Exception:
        logger.exception('Forgot password verify error')
        return jsonify({ 'message': 'Failed' }), 500

@app.post('/api/admin/forgot-password/reset')
def admin_forgot_reset():
    """Reset admin password if email exists. Public endpoint (no email OTP per requirement)."""
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip()
        password = (data.get('password') or '').strip()
        if not email or not password:
            return jsonify({ 'message': 'Email and password are required' }), 400
        pwd_hash = generate_password_hash(password)
        conn = get_db(); cur = conn.cursor()
        cur.execute("UPDATE admin_users SET password = %s WHERE email = %s AND is_active = 1", (pwd_hash, email))
        updated = cur.rowcount
        conn.commit(); cur.close(); conn.close()
        if updated == 0:
            return jsonify({ 'message': 'Email not found or inactive' }), 404
        return jsonify({ 'success': True })
    except Exception:
        logger.exception('Forgot password reset error')
        return jsonify({ 'message': 'Failed' }), 500

@app.get('/health')
def health():
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT 1')
        cur.fetchone()
        cur.close()
        conn.close()
        return jsonify({'ok': True, 'ts': datetime.now().isoformat()})
    except Exception as e:
        logger.error(f"Health check DB error: {e}")
        return jsonify({'ok': False, 'error': str(e), 'db': {
            'host': DB_CONFIG.get('host'),
            'user': DB_CONFIG.get('user'),
        }}), 500

# Minimal admin endpoints using existing tables (no new tables)

@app.get('/api/admin/overview')
@require_roles('admin')
def admin_overview():
    user_company = request.current_user.get('company_name')
    data = {
        'company': user_company,
        'totals': {
            'visits': 0,
            'uniqueVisitors': 0,
            'hosts': 0,
            # Dashboard KPIs
            'customers': 0,
            'activeUsers': 0,         # per request: companies with active subscription
            'monthlyRevenue': 0.0,    # total paid amount in current month
            'activeSubs': 0,          # Active Trials (companies in trial and not expired)
            'openTickets': 0,
            'pendingRenewals': 0
        }
    }
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        # Visits count for company
        cur.execute(
            """
            SELECT COUNT(*) AS c FROM visits v
            JOIN users h ON v.host_id = h.id
            WHERE h.company_name = %s
            """, (user_company,)
        )
        data['totals']['visits'] = cur.fetchone()['c']
        # Unique visitors by email
        cur.execute(
            """
            SELECT COUNT(DISTINCT COALESCE(v.visitor_email, vis.email)) AS c
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s
            """, (user_company,)
        )
        data['totals']['uniqueVisitors'] = cur.fetchone()['c']
        # Hosts
        cur.execute("SELECT COUNT(*) AS c FROM users WHERE company_name = %s AND role='host'", (user_company,))
        data['totals']['hosts'] = cur.fetchone()['c']
        # Total customers
        cur.execute("SELECT COUNT(*) AS c FROM companies")
        data['totals']['customers'] = cur.fetchone()['c'] or 0

        # Active companies (subscription_status = 'active')
        cur.execute("SELECT COUNT(*) AS c FROM companies WHERE subscription_status = 'active'")
        data['totals']['activeUsers'] = cur.fetchone()['c'] or 0

        # Active Trials: companies in 'trial' and trial_end_date not passed
        cur.execute("""
            SELECT COUNT(*) AS c
            FROM companies
            WHERE subscription_status = 'trial'
              AND (trial_end_date IS NULL OR trial_end_date >= CURDATE())
        """)
        data['totals']['activeSubs'] = cur.fetchone()['c'] or 0

        # Monthly Revenue: sum of paid payments in current month
        # Use payment_date if available, else created_at
        cur.execute("""
            SELECT COALESCE(SUM(amount), 0) AS amt
            FROM payments
            WHERE status = 'paid'
              AND DATE(COALESCE(payment_date, created_at))
                    BETWEEN DATE_FORMAT(CURDATE(), '%Y-%m-01') AND LAST_DAY(CURDATE())
        """)
        row = cur.fetchone()
        data['totals']['monthlyRevenue'] = float(row['amt'] or 0)

        # Open Tickets (support tickets)
        try:
            cur.execute("SELECT COUNT(*) AS c FROM tickets WHERE status = 'open'")
            data['totals']['openTickets'] = cur.fetchone()['c'] or 0
        except Exception:
            # Fallback to contact_us table if tickets table not present
            try:
                cur.execute("SELECT COUNT(*) AS c FROM contact_us WHERE status = 'open'")
                data['totals']['openTickets'] = cur.fetchone()['c'] or 0
            except Exception:
                data['totals']['openTickets'] = 0

        # Pending Renewals:
        # - companies on trial plan/status
        # - OR companies whose plan is expired within last 2 months
        # - OR companies whose subscription due date is within next 5 days
        cur.execute("""
            SELECT COUNT(*) AS c
            FROM companies
            WHERE subscription_status = 'trial'
               OR (
                    subscription_status = 'expired'
                AND subscription_end_date IS NOT NULL
                AND subscription_end_date >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
               )
               OR (
                    subscription_end_date IS NOT NULL
                AND subscription_end_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
               )
        """)
        data['totals']['pendingRenewals'] = cur.fetchone()['c'] or 0
        # ---- Charts: last 6 months ----
        try:
            months = 6
            # Build month labels and keys like '2025-08'
            from datetime import date
            today = date.today()
            def month_add(d, delta):
                y = d.year + ((d.month - 1 + delta) // 12)
                m = (d.month - 1 + delta) % 12 + 1
                return date(y, m, 1)
            month_keys = []
            labels = []
            # earliest month start
            start0 = month_add(date(today.year, today.month, 1), -(months-1))
            for i in range(months):
                d = month_add(start0, i)
                month_keys.append(d.strftime('%Y-%m'))
                labels.append(d.strftime('%b %Y'))

            # Customer Growth: new companies per month
            cur.execute(
                """
                SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym, COUNT(*) AS c
                FROM companies
                WHERE created_at >= %s
                GROUP BY ym
                """, (start0.strftime('%Y-%m-%d'),)
            )
            cust_map = {row['ym']: int(row['c'] or 0) for row in cur.fetchall() if row['ym']}

            # Active started this month (approx): companies with active status and subscription_start_date in that month
            try:
                cur.execute(
                    """
                    SELECT DATE_FORMAT(subscription_start_date, '%Y-%m') AS ym, COUNT(*) AS c
                    FROM companies
                    WHERE subscription_status = 'active'
                      AND subscription_start_date IS NOT NULL
                      AND subscription_start_date >= %s
                    GROUP BY ym
                    """, (start0.strftime('%Y-%m-%d'),)
                )
                active_map = {row['ym']: int(row['c'] or 0) for row in cur.fetchall() if row['ym']}
            except Exception:
                active_map = {}

            trends = {
                'labels': labels,
                'customers': [cust_map.get(k, 0) for k in month_keys],
                'active': [active_map.get(k, 0) for k in month_keys]
            }

            # Revenue: total and by plan (using payments joined to subscriptions for plan)
            cur.execute(
                """
                SELECT DATE_FORMAT(COALESCE(p.payment_date, p.created_at), '%Y-%m') AS ym,
                       COALESCE(SUM(p.amount),0) AS amt
                FROM payments p
                WHERE p.status = 'paid'
                  AND COALESCE(p.payment_date, p.created_at) >= %s
                GROUP BY ym
                """, (start0.strftime('%Y-%m-%d'),)
            )
            rev_map = {row['ym']: float(row['amt'] or 0) for row in cur.fetchall() if row['ym']}

            # by plan
            by_plan = {}
            cur.execute(
                """
                SELECT DATE_FORMAT(COALESCE(p.payment_date, p.created_at), '%Y-%m') AS ym,
                       s.plan AS plan,
                       COALESCE(SUM(p.amount),0) AS amt
                FROM payments p
                JOIN subscriptions s ON p.subscription_id = s.id
                WHERE p.status = 'paid'
                  AND COALESCE(p.payment_date, p.created_at) >= %s
                GROUP BY ym, plan
                """, (start0.strftime('%Y-%m-%d'),)
            )
            tmp = cur.fetchall()
            plan_keys = set([r['plan'] for r in tmp if r.get('plan')])
            for pk in plan_keys:
                by_plan[pk] = {k: 0.0 for k in month_keys}
            for r in tmp:
                ym = r.get('ym'); pk = r.get('plan'); amt = float(r.get('amt') or 0)
                if ym in month_keys and pk:
                    if pk not in by_plan:
                        by_plan[pk] = {k: 0.0 for k in month_keys}
                    by_plan[pk][ym] += amt

            revenue = {
                'labels': labels,
                'amounts': [rev_map.get(k, 0.0) for k in month_keys],
                'byPlan': { pk: [by_plan.get(pk, {}).get(k, 0.0) for k in month_keys] for pk in sorted(by_plan.keys()) }
            }

            data['trends'] = trends
            data['revenue'] = revenue
            # Additional aggregates for charts
            # Status distribution
            cur.execute("SELECT subscription_status AS s, COUNT(*) AS c FROM companies GROUP BY subscription_status")
            status_rows = cur.fetchall()
            data['statusDist'] = { (r['s'] or 'unknown'): int(r['c'] or 0) for r in status_rows }
            # Plan mix
            cur.execute("SELECT subscription_plan AS p, COUNT(*) AS c FROM companies GROUP BY subscription_plan")
            plan_rows = cur.fetchall()
            data['planMix'] = { (r['p'] or 'unknown'): int(r['c'] or 0) for r in plan_rows }
            # Renewals breakdown
            # trial total and trial due soon
            cur.execute("SELECT COUNT(*) AS c FROM companies WHERE subscription_status = 'trial'")
            trial_total = int((cur.fetchone() or {}).get('c') or 0)
            cur.execute(
                """
                SELECT COUNT(*) AS c FROM companies
                WHERE subscription_status = 'trial'
                  AND trial_end_date IS NOT NULL
                  AND trial_end_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
                """
            )
            trial_due = int((cur.fetchone() or {}).get('c') or 0)
            # expired (only those expired within last 2 months)
            cur.execute(
                """
                SELECT COUNT(*) AS c FROM companies
                WHERE subscription_status = 'expired'
                  AND subscription_end_date IS NOT NULL
                  AND subscription_end_date >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
                """
            )
            expired_c = int((cur.fetchone() or {}).get('c') or 0)
            # due soon (non-expired)
            cur.execute(
                """
                SELECT COUNT(*) AS c FROM companies
                WHERE subscription_status <> 'expired'
                  AND subscription_end_date IS NOT NULL
                  AND subscription_end_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
                """
            )
            due_soon = int((cur.fetchone() or {}).get('c') or 0)
            data['renewals'] = {
                'trialTotal': trial_total,
                'trialDueSoon': trial_due,
                'expired': expired_c,
                'dueSoon': due_soon
            }
        except Exception as e2:
            logger.warning(f"overview charts error: {e2}")
        cur.close(); conn.close()
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500
    return jsonify(data)

@app.get('/api/admin/users')
@require_roles('admin')
@require_perm('users:view')
def admin_users():
    user_company = request.current_user.get('company_name')
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT id, name, email, role, department, designation, is_active, is_verified
            FROM users WHERE company_name = %s ORDER BY role, name
            """, (user_company,)
        )
        users = cur.fetchall(); cur.close(); conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

@app.get('/api/admin/visits')
@require_roles('admin', 'ops', 'support', 'readonly')
def admin_visits():
    user_company = request.current_user.get('company_name')
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT v.id, v.check_in_time, v.check_out_time,
                   COALESCE(v.purpose_of_visit, 'General Visit') AS purpose,
                   COALESCE(vis.name, v.visitor_name) AS visitor_name,
                   h.name AS host_name
            FROM visits v
            JOIN users h ON v.host_id = h.id
            LEFT JOIN visitors vis ON v.visitor_id = vis.id
            WHERE h.company_name = %s
            ORDER BY v.check_in_time DESC
            LIMIT 200
            """, (user_company,)
        )
        items = cur.fetchall(); cur.close(); conn.close()
        return jsonify(items)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# Companies
@app.get('/api/admin/companies')
@require_roles('admin', 'ops', 'readonly')
def admin_companies():
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute(
            """
            SELECT id, company_name, email, plan_name, subscription_plan, subscription_status,
                   subscription_start_date, subscription_end_date, trial_start_date, trial_end_date,
                   payment_method, billing_contact_email, created_at
            FROM companies
            ORDER BY created_at DESC
            LIMIT 200
            """
        )
        rows = cur.fetchall(); cur.close(); conn.close()
        return jsonify(rows)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# Subscriptions
@app.get('/api/admin/subscriptions')
@require_roles('admin', 'ops', 'finance', 'readonly')
def admin_subscriptions():
    company_id = request.args.get('companyId')
    renewals_soon = request.args.get('renewalsSoon')
    limit = int(request.args.get('limit', '200'))
    limit = max(1, min(limit, 500))
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        if renewals_soon:
            # Pending Renewals dataset: trials + expired within last 2 months + due within 5 days
            cur.execute(
                """
                SELECT 
                    c.id AS company_id,
                    c.company_name,
                    CASE WHEN c.subscription_status = 'trial' THEN 'trial' ELSE c.subscription_plan END AS plan,
                    c.subscription_status AS status,
                    CASE WHEN c.subscription_status = 'trial' THEN c.trial_end_date ELSE c.subscription_end_date END AS end_date
                FROM companies c
                WHERE c.subscription_status = 'trial'
                   OR (
                        c.subscription_status = 'expired'
                    AND c.subscription_end_date IS NOT NULL
                    AND c.subscription_end_date >= DATE_SUB(CURDATE(), INTERVAL 2 MONTH)
                   )
                   OR (
                        c.subscription_end_date IS NOT NULL
                    AND c.subscription_end_date <= DATE_ADD(CURDATE(), INTERVAL 5 DAY)
                   )
                ORDER BY end_date IS NULL, end_date ASC
                LIMIT %s
                """, (limit,)
            )
        elif company_id:
            cur.execute(
                f"""
                SELECT s.*, c.company_name, c.plan_name AS plan_name
                FROM subscriptions s JOIN companies c ON s.company_id = c.id
                WHERE s.company_id = %s
                ORDER BY s.created_at DESC
                LIMIT %s
                """, (company_id, limit)
            )
        else:
            cur.execute(
                """
                SELECT s.*, c.company_name, c.plan_name AS plan_name
                FROM subscriptions s JOIN companies c ON s.company_id = c.id
                ORDER BY s.created_at DESC
                LIMIT %s
                """, (limit,)
            )
        rows = cur.fetchall(); cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# Payments
@app.get('/api/admin/payments')
@require_roles('admin', 'finance', 'ops', 'readonly')
@require_perm('billing:view')
def admin_payments():
    company_id = request.args.get('companyId')
    limit = int(request.args.get('limit', '200'))
    limit = max(1, min(limit, 500))
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        if company_id:
            cur.execute(
                f"""
          SELECT p.*, c.company_name, c.subscription_plan AS plan, c.plan_name AS plan_name,
              COALESCE(p.payment_date, p.created_at) AS payment_date
                FROM payments p JOIN companies c ON p.company_id = c.id
                WHERE p.company_id = %s
                ORDER BY p.created_at DESC
                LIMIT %s
                """, (company_id, limit)
            )
        else:
            cur.execute(
                """
          SELECT p.*, c.company_name, c.subscription_plan AS plan, c.plan_name AS plan_name,
              COALESCE(p.payment_date, p.created_at) AS payment_date
                FROM payments p JOIN companies c ON p.company_id = c.id
                ORDER BY p.created_at DESC
                LIMIT %s
                """, (limit,)
            )
        rows = cur.fetchall(); cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# Support (contact_us)
@app.get('/api/admin/support')
@require_roles('admin', 'support', 'ops', 'readonly')
def admin_support_list():
    limit = int(request.args.get('limit', '200'))
    limit = max(1, min(limit, 500))
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        # Prefer tickets table if present (schema uses created_by_company and assigned_to as VARCHAR)
        try:
            cur.execute(
                """
                SELECT t.id,
                       COALESCE(t.created_by_company, '') AS email,
                       t.status,
                       t.priority,
                       t.title,
                       t.description,
                       t.assigned_to,
                       t.created_at
                FROM tickets t
                ORDER BY t.created_at DESC
                LIMIT %s
                """, (limit,)
            )
            rows = cur.fetchall()
        except Exception:
            # Try legacy tickets schema with created_by INT and join users
            try:
                cur.execute(
                    """
                    SELECT t.id,
                           COALESCE(u.email, '') AS email,
                           t.status,
                           t.priority,
                           t.title,
                           COALESCE(t.description, '') AS description,
                           COALESCE(t.assigned_to, t.assigned_to_user_id) AS assigned_to,
                           t.created_at
                    FROM tickets t
                    LEFT JOIN users u ON u.id = t.created_by
                    ORDER BY t.created_at DESC
                    LIMIT %s
                    """, (limit,)
                )
                rows = cur.fetchall()
            except Exception:
            # Fallback to contact_us legacy table
                cur.execute(
                    """
                    SELECT id,
                           email,
                           status,
                           priority,
                           name AS title,
                           message AS description,
                           assigned_to_user_id AS assigned_to,
                           created_at
                    FROM contact_us
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,)
                )
                rows = cur.fetchall()
        cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

@app.put('/api/admin/support/<int:ticket_id>')
@require_roles('admin', 'support')
@require_perm('support:edit')
def admin_support_update(ticket_id: int):
    data = request.get_json() or {}
    status = data.get('status')
    assigned_to = data.get('assigned_to_user_id')
    priority = data.get('priority')
    allowed_status = {'open','in_progress','resolved','closed','rejected'}
    allowed_priority = {'low','medium','high'}
    try:
        conn = get_db(); cur = conn.cursor()
        # Attempt update on tickets table first
        updated = False
        sets_t = []
        params_t = []
        if status and status in allowed_status:
            sets_t.append("status = %s"); params_t.append(status)
        if priority and priority in allowed_priority:
            sets_t.append("priority = %s"); params_t.append(priority)
        if sets_t:
            params_t.append(ticket_id)
            try:
                cur.execute(f"UPDATE tickets SET {', '.join(sets_t)} WHERE id = %s", tuple(params_t))
                conn.commit(); updated = cur.rowcount > 0
            except Exception:
                updated = False
        # Fallback to contact_us (single assigned_to_user_id field) if tickets update did not apply
        if not updated:
            sets_c = []
            params_c = []
            if status and status in allowed_status and status != 'resolved':
                # contact_us has no 'resolved' status; map 'resolved' -> 'in_progress'
                mapped = status if status != 'resolved' else 'in_progress'
                sets_c.append("status = %s"); params_c.append(mapped)
            if assigned_to is not None:
                sets_c.append("assigned_to_user_id = %s"); params_c.append(assigned_to)
            if priority and priority in allowed_priority:
                sets_c.append("priority = %s"); params_c.append(priority)
            if not sets_c:
                return jsonify({'message': 'No valid fields to update'}), 400
            params_c.append(ticket_id)
            cur.execute(f"UPDATE contact_us SET {', '.join(sets_c)} WHERE id = %s", tuple(params_c))
            conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# List admin users for assignment
@app.get('/api/admin/admin-users')
@require_roles('admin', 'support')
def list_admin_users():
    """List admin users. If support role, limit to active minimal fields; admin gets full details by default.
    Optional query: minimal=1 to only return id,name,email for assignment lists.
    """
    try:
        minimal = request.args.get('minimal')
        conn = get_db(); cur = conn.cursor(dictionary=True)
        if minimal and minimal != '0':
            cur.execute("SELECT id, name, email FROM admin_users WHERE is_active = 1 ORDER BY name ASC")
        else:
            cur.execute("SELECT id, name, email, role, permissions, is_active, created_at, updated_at FROM admin_users ORDER BY created_at DESC")
        rows = cur.fetchall(); cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

def _normalize_permissions(value):
    import json
    if value is None:
        return None
    if value == '*' or value == ['*']:
        return json.dumps(['*'])
    if isinstance(value, (list, tuple)):
        return json.dumps(list(value))
    if isinstance(value, str):
        s = value.strip()
        # try parse JSON array
        try:
            arr = json.loads(s)
            if isinstance(arr, list):
                return json.dumps(arr)
        except Exception:
            pass
        # comma separated
        arr = [x.strip() for x in s.split(',') if x.strip()]
        return json.dumps(arr)
    return json.dumps([])

def role_default_permissions(role: str) -> str:
    """Return JSON string for default permissions based on role."""
    r = (role or '').strip().lower()
    if r == 'admin':
        return json.dumps(['*'])
    if r == 'ops':
        return json.dumps(['users:view','visits:view','support:view'])
    if r == 'finance':
        return json.dumps(['billing:view','subscriptions:view'])
    if r == 'support':
        return json.dumps(['support:view','support:edit'])
    # readonly and others
    return json.dumps(['support:view'])

@app.post('/api/admin/admin-users')
@require_roles('admin')
def create_admin_user():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    role = (data.get('role') or 'readonly').strip()
    password = (data.get('password') or '').strip()
    is_active = bool(data.get('is_active', True))
    if not name or not email or not password:
        return jsonify({'message': 'name, email, password are required'}), 400
    try:
        conn = get_db()
        cur = conn.cursor()
        perms_json = role_default_permissions(role)
        pwd_hash = generate_password_hash(password)
        cur.execute(
            """
            INSERT INTO admin_users (name, email, password, role, permissions, is_active)
            VALUES (%s, %s, %s, %s, %s, %s)
            """,
            (name, email, pwd_hash, role, perms_json, 1 if is_active else 0)
        )
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'success': True})
    except mysql.connector.IntegrityError as ie:
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

@app.put('/api/admin/admin-users/<int:user_id>')
@require_roles('admin')
def update_admin_user(user_id: int):
    data = request.get_json(silent=True) or {}
    fields = []
    params = []
    if 'name' in data:
        fields.append('name = %s'); params.append((data.get('name') or '').strip())
    if 'email' in data:
        fields.append('email = %s'); params.append((data.get('email') or '').strip())
    if 'role' in data:
        role = (data.get('role') or 'readonly').strip()
        fields.append('role = %s'); params.append(role)
        # auto-assign permissions based on role
        fields.append('permissions = %s'); params.append(role_default_permissions(role))
    if 'is_active' in data:
        fields.append('is_active = %s'); params.append(1 if bool(data.get('is_active')) else 0)
    if 'password' in data and (data.get('password') or '').strip():
        fields.append('password = %s'); params.append(generate_password_hash((data.get('password') or '').strip()))
    if not fields:
        return jsonify({'message': 'No valid fields to update'}), 400
    try:
        conn = get_db(); cur = conn.cursor()
        params.append(user_id)
        cur.execute(f"UPDATE admin_users SET {', '.join(fields)} WHERE id = %s", tuple(params))
        conn.commit(); cur.close(); conn.close()
        return jsonify({'success': True})
    except mysql.connector.IntegrityError as ie:
        return jsonify({'message': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

@app.delete('/api/admin/admin-users/<int:user_id>')
@require_roles('admin')
def delete_admin_user(user_id: int):
    """Hard delete the admin user record."""
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("DELETE FROM admin_users WHERE id = %s", (user_id,))
        deleted = cur.rowcount
        conn.commit(); cur.close(); conn.close()
        if deleted == 0:
            return jsonify({'message': 'Not found'}), 404
        return jsonify({'success': True, 'deleted': deleted})
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# Assign multiple admins to a ticket (tickets.assigned_to as comma-separated IDs)
@app.put('/api/admin/support/<int:ticket_id>/assign')
@require_roles('admin', 'support')
@require_perm('support:edit')
def assign_ticket(ticket_id: int):
    data = request.get_json(silent=True) or {}
    ids = data.get('assigned_to_ids')
    if not isinstance(ids, list) or not all(isinstance(x, (int, str)) for x in ids):
        return jsonify({'message': 'assigned_to_ids must be an array of ids'}), 400
    # normalize: unique ints, positive
    try:
        norm = []
        for x in ids:
            i = int(x)
            if i > 0 and i not in norm:
                norm.append(i)
    except Exception:
        return jsonify({'message': 'assigned_to_ids must be integers'}), 400
    assigned_str = ','.join(str(i) for i in norm)
    try:
        conn = get_db(); cur = conn.cursor()
        updated = False
        try:
            cur.execute("UPDATE tickets SET assigned_to = %s WHERE id = %s", (assigned_str, ticket_id))
            conn.commit(); updated = cur.rowcount > 0
        except Exception:
            updated = False
        if not updated:
            # fallback: contact_us has single assigned_to_user_id; set first id if any
            first_id = norm[0] if norm else None
            cur.execute("UPDATE contact_us SET assigned_to_user_id = %s WHERE id = %s", (first_id, ticket_id))
            conn.commit()
        cur.close(); conn.close();
        return jsonify({'success': True, 'assigned_to': assigned_str})
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

# Settings
@app.get('/api/admin/system-settings')
@require_roles('admin', 'super_admin')
def get_system_settings():
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM system_settings ORDER BY id ASC LIMIT 1")
        row = cur.fetchone(); cur.close(); conn.close(); return jsonify(row or {})
    except Exception as e:
        return jsonify({'message': 'Failed', 'error': str(e)}), 500

@app.put('/api/admin/system-settings')
@require_roles('admin', 'super_admin')
def update_system_settings():
    data = request.get_json() or {}
    allowed = [
        'emailNotifications','requireApproval','maxVisitorsPerDay','retainPeriodDays',
        'allowSelfCheckOut','capturePhoto','systemName','companyLogo','theme','language',
        'timezone','dateFormat','timeFormat'
    ]
    sets = []
    params = []
    for k in allowed:
        if k in data:
            sets.append(f"{k} = %s"); params.append(data[k])
    if not sets:
        return jsonify({'message':'No valid settings provided'}), 400
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(f"UPDATE system_settings SET {', '.join(sets)} ORDER BY id ASC LIMIT 1", tuple(params))
        conn.commit(); cur.close(); conn.close(); return jsonify({'success': True})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

@app.get('/api/admin/company-settings')
@require_roles('admin', 'ops')
def get_company_settings():
    company_id = request.args.get('companyId')
    if not company_id:
        return jsonify({'message':'companyId is required'}), 400
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM company_settings WHERE company_id = %s ORDER BY id DESC LIMIT 1", (company_id,))
        row = cur.fetchone(); cur.close(); conn.close(); return jsonify(row or {})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

@app.put('/api/admin/company-settings')
@require_roles('admin', 'ops')
def update_company_settings():
    data = request.get_json() or {}
    company_id = data.get('company_id')
    settings = data.get('settings')
    if not company_id or settings is None:
        return jsonify({'message':'company_id and settings required'}), 400
    try:
        import json
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            "INSERT INTO company_settings (company_id, settings) VALUES (%s, %s)",
            (company_id, json.dumps(settings))
        )
        conn.commit(); cur.close(); conn.close(); return jsonify({'success': True})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Pricing plans
@app.get('/api/admin/pricing-plans')
@require_roles('admin', 'finance', 'ops', 'readonly')
def pricing_plans():
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM pricing_plans ORDER BY plan_name ASC")
        rows = cur.fetchall(); cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Create pricing plan
@app.post('/api/admin/pricing-plans')
@require_roles('admin', 'finance')
def create_pricing_plan():
    data = request.get_json(silent=True) or {}
    plan_name = (data.get('plan_name') or '').strip()
    billing_cycle = (data.get('billing_cycle') or 'monthly').strip() or 'monthly'
    price = data.get('price')
    currency = (data.get('currency') or 'INR').strip() or 'INR'
    description = data.get('description')
    if not plan_name or price is None:
        return jsonify({'message':'plan_name and price are required'}), 400
    try:
        conn = get_db(); ensure_pricing_cycle_enum(conn); cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO pricing_plans (plan_name, billing_cycle, price, currency, description)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (plan_name, billing_cycle, price, currency, description)
        )
        conn.commit(); cur.close(); conn.close()
        return jsonify({'success': True})
    except mysql.connector.IntegrityError as ie:
        return jsonify({'message':'Plan already exists for this billing cycle'}), 409
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Update pricing plan
@app.put('/api/admin/pricing-plans/<int:plan_id>')
@require_roles('admin', 'finance')
def update_pricing_plan(plan_id: int):
    data = request.get_json(silent=True) or {}
    fields = []
    params = []
    for k in ['plan_name','billing_cycle','price','currency','description']:
        if k in data:
            fields.append(f"{k} = %s"); params.append(data.get(k))
    if not fields:
        return jsonify({'message':'No fields to update'}), 400
    try:
        conn = get_db(); ensure_pricing_cycle_enum(conn); cur = conn.cursor()
        params.append(plan_id)
        cur.execute(f"UPDATE pricing_plans SET {', '.join(fields)} WHERE id = %s", tuple(params))
        conn.commit(); cur.close(); conn.close()
        return jsonify({'success': True})
    except mysql.connector.IntegrityError:
        return jsonify({'message':'Duplicate plan/billing_cycle'}), 409
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Delete pricing plan
@app.delete('/api/admin/pricing-plans/<int:plan_id>')
@require_roles('admin', 'finance')
def delete_pricing_plan(plan_id: int):
    try:
        conn = get_db(); cur = conn.cursor()
        # Ensure features table exists to apply FK cascade if present
        ensure_pricing_features_table(conn)
        cur.execute("DELETE FROM pricing_plans WHERE id = %s", (plan_id,))
        deleted = cur.rowcount
        conn.commit(); cur.close(); conn.close()
        if deleted == 0:
            return jsonify({'message': 'Not found'}), 404
        return jsonify({'success': True, 'deleted': deleted})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Pricing plan features
@app.get('/api/admin/pricing-plan-features')
@require_roles('admin', 'finance', 'ops', 'readonly')
def list_pricing_features():
    plan_id = request.args.get('plan_id')
    try:
        conn = get_db(); ensure_pricing_features_table(conn); cur = conn.cursor(dictionary=True)
        if plan_id:
            cur.execute(
                "SELECT f.*, p.plan_name FROM pricing_plan_features f JOIN pricing_plans p ON f.plan_id = p.id WHERE f.plan_id = %s ORDER BY f.display_order ASC, f.id ASC",
                (plan_id,)
            )
        else:
            cur.execute(
                "SELECT f.*, p.plan_name FROM pricing_plan_features f JOIN pricing_plans p ON f.plan_id = p.id ORDER BY p.plan_name ASC, f.display_order ASC, f.id ASC"
            )
        rows = cur.fetchall(); cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

@app.post('/api/admin/pricing-plan-features')
@require_roles('admin', 'finance')
def create_pricing_feature():
    data = request.get_json(silent=True) or {}
    plan_id = data.get('plan_id')
    feature_name = (data.get('feature_name') or '').strip()
    is_included = bool(data.get('is_included', True))
    display_order = int(data.get('display_order', 0) or 0)
    if not plan_id or not feature_name:
        return jsonify({'message':'plan_id and feature_name are required'}), 400
    try:
        conn = get_db(); ensure_pricing_features_table(conn); cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO pricing_plan_features (plan_id, feature_name, is_included, display_order)
            VALUES (%s, %s, %s, %s)
            """,
            (plan_id, feature_name, 1 if is_included else 0, display_order)
        )
        conn.commit(); cur.close(); conn.close(); return jsonify({'success': True})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

@app.put('/api/admin/pricing-plan-features/<int:feature_id>')
@require_roles('admin', 'finance')
def update_pricing_feature(feature_id: int):
    data = request.get_json(silent=True) or {}
    fields = []
    params = []
    if 'plan_id' in data:
        fields.append('plan_id = %s'); params.append(data.get('plan_id'))
    if 'feature_name' in data:
        fields.append('feature_name = %s'); params.append((data.get('feature_name') or '').strip())
    if 'is_included' in data:
        fields.append('is_included = %s'); params.append(1 if bool(data.get('is_included')) else 0)
    if 'display_order' in data:
        fields.append('display_order = %s'); params.append(int(data.get('display_order') or 0))
    if not fields:
        return jsonify({'message':'No fields to update'}), 400
    try:
        conn = get_db(); ensure_pricing_features_table(conn); cur = conn.cursor()
        params.append(feature_id)
        cur.execute(f"UPDATE pricing_plan_features SET {', '.join(fields)} WHERE id = %s", tuple(params))
        conn.commit(); cur.close(); conn.close(); return jsonify({'success': True})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

@app.delete('/api/admin/pricing-plan-features/<int:feature_id>')
@require_roles('admin', 'finance')
def delete_pricing_feature(feature_id: int):
    try:
        conn = get_db(); ensure_pricing_features_table(conn); cur = conn.cursor()
        cur.execute("DELETE FROM pricing_plan_features WHERE id = %s", (feature_id,))
        deleted = cur.rowcount
        conn.commit(); cur.close(); conn.close()
        if deleted == 0:
            return jsonify({'message': 'Not found'}), 404
        return jsonify({'success': True, 'deleted': deleted})
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Combined: plans with features
@app.get('/api/admin/pricing-plans-with-features')
@require_roles('admin', 'finance', 'ops', 'readonly')
def pricing_plans_with_features():
    try:
        conn = get_db(); ensure_pricing_features_table(conn); cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM pricing_plans ORDER BY price ASC")
        plans = cur.fetchall()
        cur.execute("SELECT * FROM pricing_plan_features ORDER BY display_order ASC, id ASC")
        feats = cur.fetchall(); cur.close(); conn.close()
        by_plan = {}
        for p in plans:
            by_plan[p['id']] = []
        for f in feats:
            arr = by_plan.get(f.get('plan_id'))
            if arr is not None:
                arr.append(f)
        for p in plans:
            p['features'] = by_plan.get(p['id'], [])
        return jsonify(plans)
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

# Audit logs
@app.get('/api/admin/audit-logs')
@require_roles('admin', 'super_admin', 'ops', 'readonly')
def audit_logs():
    company_id = request.args.get('companyId')
    user_id = request.args.get('userId')
    limit = int(request.args.get('limit', '100'))
    limit = max(1, min(limit, 500))
    try:
        conn = get_db(); cur = conn.cursor(dictionary=True)
        base = "SELECT id, company_id, user_id, action, table_name, record_id, timestamp FROM audit_logs WHERE 1=1"
        params = []
        if company_id:
            base += " AND company_id = %s"; params.append(company_id)
        if user_id:
            base += " AND user_id = %s"; params.append(user_id)
        base += " ORDER BY timestamp DESC LIMIT %s"; params.append(limit)
        cur.execute(base, tuple(params))
        rows = cur.fetchall(); cur.close(); conn.close(); return jsonify(rows)
    except Exception as e:
        return jsonify({'message':'Failed', 'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4200, debug=True)
