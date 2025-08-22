import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Companies from './pages/Companies';
import Billing from './pages/Billing';
import Support from './pages/Support';
import Settings from './pages/Settings';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';

function useAuth() {
  const token = localStorage.getItem('jwt_token');
  return !!token;
}

function Protected({ children }) {
  const authed = useAuth();
  return authed ? children : <Navigate to="/login" replace />;
}

function Login() {
  const API = process.env.REACT_APP_ADMIN_API;
  const APP_NAME = process.env.REACT_APP_NAME || 'Admin Portal';
  const savedEmail = (typeof window !== 'undefined' && localStorage.getItem('admin_login_email')) || '';
  const [email, setEmail] = React.useState(savedEmail);
  const [password, setPassword] = React.useState('');
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(Boolean(savedEmail));
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState('login'); // 'login' | 'forgotEmail' | 'reset'
  const [fpEmail, setFpEmail] = React.useState(savedEmail);
  const [resetPwd, setResetPwd] = React.useState('');
  const [resetPwd2, setResetPwd2] = React.useState('');
  const nav = useNavigate();

  const onLogin = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: (email||'').trim(), password })
      });
      if (!res.ok) {
        const t = await res.json().catch(()=>({ message: 'Login failed'}));
        setError(t.message || 'Login failed');
        setLoading(false);
        return;
      }
      const data = await res.json();
      localStorage.setItem('jwt_token', data.token);
      if (remember) localStorage.setItem('admin_login_email', (email||'').trim());
      else localStorage.removeItem('admin_login_email');
      nav('/');
    } catch (e) {
      setError('Network error');
      setLoading(false);
    }
  };
  const onKeyDown = (e) => { if (e.key === 'Enter') { mode==='login' ? onLogin() : (mode==='forgotEmail' ? onVerifyEmail() : onDoReset()); } };

  const onVerifyEmail = async () => {
    if (!fpEmail) { setError('Email is required'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forgot-password/verify`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email: fpEmail.trim() }) });
      if (!res.ok) {
        const t = await res.json().catch(()=>({message:'Email not found'}));
        setError(t.message || 'Email not found'); setLoading(false); return;
      }
      setMode('reset'); setLoading(false);
    } catch (e) { setError('Network error'); setLoading(false); }
  };

  const onDoReset = async () => {
    if (!resetPwd || !resetPwd2) { setError('Enter password in both fields'); return; }
    if (resetPwd !== resetPwd2) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/forgot-password/reset`, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ email: fpEmail.trim(), password: resetPwd }) });
      if (!res.ok) {
        const t = await res.json().catch(()=>({message:'Reset failed'}));
        setError(t.message || 'Reset failed'); setLoading(false); return;
      }
      // Success: go back to login
      setMode('login'); setLoading(false);
      setPassword(''); setResetPwd(''); setResetPwd2(''); setEmail(fpEmail.trim());
    } catch (e) { setError('Network error'); setLoading(false); }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)', padding: 16 }}>
      <div style={{ width:'100%', maxWidth: 920, display:'grid', gridTemplateColumns:'1.1fr 1fr', gap: 20, alignItems:'stretch' }}>
        <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:24 }}>
          <div style={{ fontSize: 14, letterSpacing: 2, color:'#64748b' }}>WELCOME TO</div>
          <div style={{ fontSize: 34, fontWeight: 800, color:'#0f172a', marginTop: 6 }}>{APP_NAME}</div>
          <div style={{ marginTop: 10, maxWidth: 520, lineHeight: 1.6, color:'#475569' }}>
            Manage companies, users, billing, and support from a single dashboard. Sign in to continue.
          </div>
          <div style={{ marginTop: 24, display:'flex', gap:10, alignItems:'center', color:'#2563eb' }}>
            <i className="pi pi-lock" />
            <span>Secure admin access</span>
          </div>
        </div>
        <div style={{ background:'#ffffff', borderRadius: 16, boxShadow:'0 8px 24px rgba(15, 23, 42, 0.06)', padding: 26 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>Sign in</div>
              <div style={{ fontSize: 12, color:'#6b7280' }}>Use your admin credentials</div>
            </div>
            <div style={{ width:40, height:40, background:'#eef2ff', color:'#4f46e5', borderRadius:10, display:'grid', placeItems:'center', fontWeight:800 }}>A</div>
          </div>
          <div style={{ display:'grid', gap:12 }}>
            {mode==='login' && (
              <>
                <label>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>Email</div>
                  <div style={{ position:'relative' }}>
                    <i className="pi pi-envelope" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e)=>setEmail(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="you@example.com"
                      style={{ width:'100%', height:40, padding:'0 40px', border:'1px solid #e5e7eb', borderRadius:999, outline:'none' }}
                    />
                  </div>
                </label>
                <label>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>Password</div>
                  <div style={{ position:'relative' }}>
                    <i className="pi pi-key" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e)=>setPassword(e.target.value)}
                      onKeyDown={onKeyDown}
                      placeholder="••••••••"
                      style={{ width:'100%', height:40, padding:'0 40px', border:'1px solid #e5e7eb', borderRadius:999, outline:'none' }}
                    />
                    <i
                      className={`pi ${showPwd ? 'pi-eye-slash' : 'pi-eye'}`}
                      onClick={()=>setShowPwd(s=>!s)}
                      title={showPwd ? 'Hide password' : 'Show password'}
                      style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af', cursor:'pointer' }}
                    />
                  </div>
                </label>
              </>
            )}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              {mode==='login' && (
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'#374151' }}>
                  <input type="checkbox" checked={remember} onChange={(e)=>setRemember(e.target.checked)} />
                  <span>Remember me</span>
                </label>
              )}
              {mode==='login' ? (
                <a href="#" style={{ fontSize:13, color:'#2563eb', textDecoration:'none', marginLeft: mode==='login' ? 'auto' : 0 }} onClick={(e)=>{e.preventDefault(); setMode('forgotEmail'); setError('');}}>Forgot password?</a>
              ) : (
                <a href="#" style={{ fontSize:13, color:'#2563eb', textDecoration:'none', marginLeft: 'auto' }} onClick={(e)=>{e.preventDefault(); setMode('login'); setError('');}}>Back to sign in</a>
              )}
            </div>
            {error && (
              <div style={{ background:'#fef2f2', color:'#991b1b', border:'1px solid #fecaca', padding:'8px 12px', borderRadius:8, fontSize:13 }}>
                <i className="pi pi-exclamation-triangle" style={{ marginRight:6 }} /> {error}
              </div>
            )}
            {mode==='login' && (
              <button
                onClick={onLogin}
                disabled={loading || !email || !password}
                style={{ height:42, borderRadius:999, background: loading ? '#9ca3af' : 'linear-gradient(90deg, #4f46e5, #0ea5e9)', color:'#fff', border:'none', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
              >
                {loading && <i className="pi pi-spin pi-spinner" />}<span>{loading ? 'Signing in…' : 'Sign in'}</span>
              </button>
            )}
            {mode==='forgotEmail' && (
              <div style={{ display:'grid', gap:12 }}>
                <label>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>Enter your email</div>
                  <div style={{ position:'relative' }}>
                    <i className="pi pi-envelope" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                    <input type="email" value={fpEmail} onChange={(e)=>setFpEmail(e.target.value)} placeholder="you@example.com" style={{ width:'100%', height:40, padding:'0 40px', border:'1px solid #e5e7eb', borderRadius:999, outline:'none' }} />
                  </div>
                </label>
                <button onClick={onVerifyEmail} disabled={loading || !fpEmail} style={{ height:42, borderRadius:999, background: loading ? '#9ca3af' : '#2563eb', color:'#fff', border:'none', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Verifying…' : 'Verify email'}
                </button>
              </div>
            )}
            {mode==='reset' && (
              <div style={{ display:'grid', gap:12 }}>
                <label>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>Create password</div>
                  <div style={{ position:'relative' }}>
                    <i className="pi pi-key" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                    <input type="password" value={resetPwd} onChange={(e)=>setResetPwd(e.target.value)} placeholder="New password" style={{ width:'100%', height:40, padding:'0 40px', border:'1px solid #e5e7eb', borderRadius:999, outline:'none' }} />
                  </div>
                </label>
                <label>
                  <div style={{ fontSize:12, color:'#6b7280', marginBottom:6 }}>Re-enter password</div>
                  <div style={{ position:'relative' }}>
                    <i className="pi pi-key" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
                    <input type="password" value={resetPwd2} onChange={(e)=>setResetPwd2(e.target.value)} placeholder="Re-enter password" style={{ width:'100%', height:40, padding:'0 40px', border:'1px solid #e5e7eb', borderRadius:999, outline:'none' }} />
                  </div>
                </label>
                <button onClick={onDoReset} disabled={loading || !resetPwd || !resetPwd2} style={{ height:42, borderRadius:999, background: loading ? '#9ca3af' : '#10b981', color:'#fff', border:'none', fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  {loading ? 'Saving…' : 'Save password'}
                </button>
              </div>
            )}
          </div>
          <div style={{ marginTop: 16, fontSize:12, color:'#6b7280', textAlign:'center' }}>
            By continuing you agree to our Terms and Privacy Policy.
          </div>
        </div>
      </div>
    </div>
  );
}

function Layout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <Topbar />
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <Sidebar />
        <main style={{ flex: 1, padding: 16, overflowY: 'auto', minHeight: 0, minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <Protected>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/users" element={<Users />} />
                <Route path="/companies" element={<Companies />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/support" element={<Support />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </Protected>
        }
      />
    </Routes>
  );
}
