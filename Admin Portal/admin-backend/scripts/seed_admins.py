import os
import json
import logging
from datetime import datetime
from dotenv import load_dotenv
import mysql.connector
from werkzeug.security import generate_password_hash

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed-admins")

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'vms_db')
}

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


def get_db():
    last_err = None
    for cfg in DB_FALLBACK_CONFIGS:
        try:
            conn = mysql.connector.connect(**cfg)
            if conn.is_connected():
                if cfg is not DB_CONFIG:
                    logger.info(f"DB connected using fallback host={cfg['host']} user={cfg['user']} pwd={'set' if cfg['password'] else 'empty'}")
                return conn
        except Exception as e:
            last_err = e
            continue
    if last_err:
        raise last_err
    raise Exception("Database connection failed")


def table_exists(cur, table_name: str) -> bool:
    cur.execute("SHOW TABLES LIKE %s", (table_name,))
    return cur.fetchone() is not None


def seed_admins():
    conn = get_db(); cur = conn.cursor()
    if not table_exists(cur, 'admin_users'):
        logger.error("Table 'admin_users' not found. Apply database/init.sql before seeding.")
        cur.close(); conn.close(); return 1

    users = [
        {
            'name': 'Platform Admin',
            'email': 'platform.admin@pranathiss.local',
            'password': 'admin123$',
            'role': 'admin',
            'permissions': ['*'],
            'is_active': 1
        },
        {
            'name': 'Ops Admin',
            'email': 'ops.admin@pranathiss.local',
            'password': 'ops123@',
            'role': 'ops',
            'permissions': ['users:view','visits:view','company-settings:edit','audit-logs:view','support:view'],
            'is_active': 1
        },
        {
            'name': 'Finance Admin',
            'email': 'finance.admin@pranathiss.local',
            'password': 'finance123!',
            'role': 'finance',
            'permissions': ['billing:view','subscriptions:view','audit-logs:view'],
            'is_active': 1
        },
        {
            'name': 'Support Agent',
            'email': 'support.agent@pranathiss.local',
            'password': 'support123',
            'role': 'support',
            'permissions': ['support:view','support:edit','audit-logs:view'],
            'is_active': 1
        },
        {
            'name': 'Readonly Viewer',
            'email': 'readonly.viewer@pranathiss.local',
            'password': 'test123',
            'role': 'readonly',
            'permissions': ['users:view','visits:view','companies:view','subscriptions:view','audit-logs:view'],
            'is_active': 1
        }
    ]

    sql = (
        "INSERT INTO admin_users (name, email, password, role, permissions, is_active) "
        "VALUES (%s, %s, %s, %s, %s, %s) "
        "ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), permissions=VALUES(permissions), is_active=VALUES(is_active)"
    )

    count = 0
    for u in users:
        pwd_hash = generate_password_hash(u['password'])
        cur.execute(sql, (
            u['name'], u['email'], pwd_hash, u['role'], json.dumps(u['permissions']), u['is_active']
        ))
        count += 1

    conn.commit(); cur.close(); conn.close()
    logger.info(f"Seeded {count} admin portal users (idempotent)")
    return 0


if __name__ == '__main__':
    raise SystemExit(seed_admins())
