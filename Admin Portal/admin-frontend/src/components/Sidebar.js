import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { hasPerm, hasRole } from '../utils/auth';

// Grouped side panel per provided structure
const navGroups = [
  {
    header: null,
    items: [ { label: 'Dashboard', to: '/', icon: 'pi pi-home' } ]
  },
  {
    header: 'Customers',
  // Companies left open for all logged-in admins (no explicit perm needed here)
  items: [ { label: 'Companies', to: '/companies', icon: 'pi pi-building' } ]
  },
  {
    header: 'Payments',
    // Billing page shows subscriptions + payments
  items: [ { label: 'Billing', to: '/billing', icon: 'pi pi-credit-card', requiredPerm: 'billing:view' } ]
  },
  {
    header: 'Support',
  items: [ { label: 'Support', to: '/support', icon: 'pi pi-life-ring', requiredPerm: 'support:view' } ]
  },
  {
    header: 'User Mgmt',
  items: [ { label: 'Users', to: '/users', icon: 'pi pi-users', requiredPerm: 'users:view' } ]
  },
  {
    header: 'System',
  // Restrict Settings to admin or higher (or a custom perm if provided)
  items: [ { label: 'Settings', to: '/settings', icon: 'pi pi-cog', requiredRole: 'admin', optionalPerm: 'settings:manage' } ]
  },
];

function isActivePath(currentPath, to) {
  if (to === '/') return currentPath === '/';
  return currentPath === to || currentPath.startsWith(to + '/');
}

export default function Sidebar() {
  const location = useLocation();
  const canAccess = (item) => {
    // If a specific role is required, allow admins/super_admin via hasRole('admin').
    if (item.requiredRole) {
      if (hasRole(item.requiredRole)) return true;
    }
    // If a specific perm is required, check it.
    if (item.requiredPerm) {
      if (hasPerm(item.requiredPerm)) return true;
      // If optionalPerm provided, allow either.
      if (item.optionalPerm && hasPerm(item.optionalPerm)) return true;
      return false;
    }
    // No specific restriction -> accessible
    return true;
  };
  return (
    <aside
      style={{
        width: 240,
        background: '#f8f9fb',
        borderRight: '1px solid #e6e6e6',
        padding: 12,
        display: 'flex',
        flexDirection: 'column',
  gap: 8,
  overflow: 'hidden',
  flex: '0 0 240px',
  position: 'sticky',
  top: 0,
  height: '100vh'
      }}
    >
      <div style={{ fontSize: 12, color: '#6b7280', padding: '4px 8px' }}>ADMIN PORTAL</div>
      <nav style={{ display: 'grid', gap: 12 }}>
        {navGroups.map((group) => (
          <div key={group.header ?? 'root'}>
            {group.header && (
              <div style={{ fontSize: 11, color: '#9ca3af', padding: '4px 8px 6px' }}>{group.header}</div>
            )}
            <div style={{ display: 'grid', gap: 6 }}>
              {group.items.map((item) => {
                const active = isActivePath(location.pathname, item.to);
                const allowed = canAccess(item);
                return (
                  allowed ? (
                    <Link
                      key={item.to}
                      to={item.to}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: active ? '#0b5ed7' : '#111',
                        background: active ? '#e7f1ff' : 'transparent',
                        fontWeight: active ? 600 : 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10
                      }}
                    >
                      <i className={item.icon} style={{ fontSize: 16, opacity: active ? 1 : 0.7 }} />
                      <span>{item.label}</span>
                    </Link>
                  ) : (
                    <div
                      key={item.to}
                      aria-disabled
                      title="You don't have permission to access this page"
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        color: '#9ca3af',
                        background: 'transparent',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'not-allowed',
                        opacity: 0.6,
                        userSelect: 'none'
                      }}
                    >
                      <i className={item.icon} style={{ fontSize: 16, opacity: 0.6 }} />
                      <span>{item.label}</span>
                    </div>
                  )
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
