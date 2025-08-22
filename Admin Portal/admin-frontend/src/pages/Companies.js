import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

const API = process.env.REACT_APP_ADMIN_API;

export default function Companies() {
  const [items, setItems] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [plan, setPlan] = React.useState('ALL');
  const [status, setStatus] = React.useState('ALL');
  const bearer = localStorage.getItem('jwt_token');
  React.useEffect(()=>{ if (!bearer) window.location.href = '/login'; }, [bearer]);

  React.useEffect(() => {
    fetch(`${API}/api/admin/companies`, { headers: { Authorization: `Bearer ${bearer}` } })
      .then(r=>r.json())
      .then(j => setItems(Array.isArray(j) ? j : (j && Array.isArray(j.data) ? j.data : [])))
      .catch(err => { console.error(err); setItems([]); });
  }, []);

  const plans = [
    { label: 'All Plans', value: 'ALL' },
    { label: 'free', value: 'free' },
    { label: 'monthly', value: 'monthly' },
    { label: 'yearly', value: 'yearly' },
    { label: 'enterprise', value: 'enterprise' },
  ];
  const statuses = [
    { label: 'All Status', value: 'ALL' },
    { label: 'active', value: 'active' },
    { label: 'expired', value: 'expired' },
    { label: 'cancelled', value: 'cancelled' },
    { label: 'trial', value: 'trial' },
  ];

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    return list.filter(it => {
      const matchQ = !ql || (it.company_name?.toLowerCase().includes(ql) || it.email?.toLowerCase().includes(ql));
  const matchPlan = plan === 'ALL' || it.subscription_plan === plan;
  const matchStatus = status === 'ALL' || it.subscription_status === status;
      return matchQ && matchPlan && matchStatus;
    });
  }, [items, q, plan, status]);

  // Summary counts
  const counts = React.useMemo(() => ({
    total: filtered.length,
    active: filtered.filter(x=>x.subscription_status==='active').length,
    trial: filtered.filter(x=>x.subscription_status==='trial').length,
    expired: filtered.filter(x=>x.subscription_status==='expired').length,
  }), [filtered]);

  // Badge templates
  const pill = (text, bg, color) => (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius: 999, background:bg, color, fontSize:12, fontWeight:600 }}>
      {text}
    </span>
  );
  const planTemplate = (row) => {
    const v = row.subscription_plan || 'free';
    const map = { free:['#e5e7eb','#111827'], monthly:['#dbeafe','#1d4ed8'], yearly:['#dcfce7','#065f46'], enterprise:['#ede9fe','#4c1d95'] };
    const [bg, fg] = map[v] || map.free; return pill(v, bg, fg);
  };
  const statusTemplate = (row) => {
    const v = row.subscription_status || 'unknown';
    const map = { active:['#dcfce7','#065f46'], trial:['#fffbeb','#92400e'], expired:['#fee2e2','#991b1b'], cancelled:['#e5e7eb','#374151'] };
    const [bg, fg] = map[v] || ['#e5e7eb','#374151']; return pill(v, bg, fg);
  };
  const planNameTemplate = (row) => {
    const v = row.plan_name || '-';
    if (v === '-') return v;
    const key = String(v).toLowerCase();
    const map = { basic:['#e0f2fe','#075985'], professional:['#ede9fe','#4c1d95'], enterprise:['#fee2e2','#991b1b'] };
    const [bg, fg] = map[key] || ['#e5e7eb','#374151'];
    return pill(v, bg, fg);
  };
  const endTemplate = (row) => {
    const end = row.subscription_status === 'trial' ? row.trial_end_date : row.subscription_end_date;
    if (!end) return '-';
    const today = new Date(); today.setHours(0,0,0,0);
    const d = new Date(end);
    const diffDays = Math.floor((d - today) / (1000*60*60*24));
    let tone = '#6b7280';
    if (diffDays < 0) tone = '#b91c1c'; else if (diffDays <= 5) tone = '#d97706'; else tone = '#065f46';
    const suffix = diffDays < 0 ? `${Math.abs(diffDays)} days ago` : `in ${diffDays} days`;
    return (
      <div style={{ display:'flex', flexDirection:'column' }}>
        <span>{end}</span>
        <span style={{ fontSize:12, color:tone }}>{suffix}</span>
      </div>
    );
  };

  return (
    <div>
      <h2>Companies</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position:'relative', width: 320, maxWidth: '100%' }}>
          <i className="pi pi-search" style={{ position:'absolute', left: 12, top: '50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
          <InputText
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === 'Escape') setQ(''); }}
            placeholder="Search companies or emails"
            aria-label="Search companies"
            style={{ width:'100%', paddingLeft: 36, paddingRight: 32, borderRadius: 999, height: 36, boxShadow:'inset 0 0 0 1px #e5e7eb' }}
          />
          {q && (
            <i
              className="pi pi-times"
              title="Clear"
              onClick={()=>setQ('')}
              style={{ position:'absolute', right: 10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af' }}
            />
          )}
        </div>
        <Dropdown options={plans} value={plan} onChange={(e)=>setPlan(e.value)} placeholder="Plan" style={{ width: 180 }} />
        <Dropdown options={statuses} value={status} onChange={(e)=>setStatus(e.value)} placeholder="Status" style={{ width: 180 }} />
  <Button label="Clear" outlined onClick={()=>{ setQ(''); setPlan('ALL'); setStatus('ALL'); }} />
        <span style={{ marginLeft: 'auto' }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:12 }}>
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>Total</div>
          <div style={{ fontWeight:700, fontSize:18 }}>{counts.total}</div>
        </div>
        <div style={{ background:'#dcfce7', border:'1px solid #a7f3d0', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#065f46' }}>Active</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#065f46' }}>{counts.active}</div>
        </div>
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#92400e' }}>Trial</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#92400e' }}>{counts.trial}</div>
        </div>
        <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#991b1b' }}>Expired</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#991b1b' }}>{counts.expired}</div>
        </div>
      </div>
      <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10,20,50]} responsiveLayout="scroll" dataKey="id">
        <Column field="company_name" header="Company" sortable></Column>
        <Column field="email" header="Email" sortable></Column>
        <Column header="Plan" body={planTemplate}></Column>
        <Column header="Plan Name" body={planNameTemplate}></Column>
        <Column header="Status" body={statusTemplate}></Column>
        <Column header="Ends" body={endTemplate}></Column>
      </DataTable>
    </div>
  );
}
