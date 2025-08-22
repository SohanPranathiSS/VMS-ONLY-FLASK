import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Topbar() {
  const nav = useNavigate();
  const logout = () => { localStorage.removeItem('jwt_token'); nav('/login'); };
  return (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 56, padding: '0 16px', borderBottom: '1px solid #eee', boxSizing: 'border-box', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
      <div style={{ fontWeight: 700 }}>Admin Portal</div>
      <button
        type="button"
        onClick={logout}
        style={{ marginLeft: 'auto', fontSize: 16, padding: '8px 14px', borderRadius: 999, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer' }}
        title="Logout"
      >
        Logout
      </button>
    </div>
  );
}
