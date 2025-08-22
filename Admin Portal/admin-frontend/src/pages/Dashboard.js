import React from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { hasPerm, hasRole } from '../utils/auth';

const API = process.env.REACT_APP_ADMIN_API;

export default function Dashboard() {
  const [data, setData] = React.useState(null);
  const [payments, setPayments] = React.useState([]);
  const [tickets, setTickets] = React.useState([]);
  const [renewals, setRenewals] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [timeframe, setTimeframe] = React.useState('30d'); // UI-only for now
  const [reloadKey, setReloadKey] = React.useState(0);
  const bearer = localStorage.getItem('jwt_token');
  const auth = `Bearer ${bearer}`;

  React.useEffect(()=>{ if (!bearer) window.location.href = '/login'; }, [bearer]);

  React.useEffect(() => {
    const isAdmin = hasRole('admin');
    const canBilling = hasPerm('billing:view');
    setLoading(true); setError('');
    const safeJson = async (res, defVal) => {
      try {
        if (!res || !res.ok) return defVal;
        const v = await res.json();
        return v ?? defVal;
      } catch { return defVal; }
    };
    const pOverview = isAdmin
      ? fetch(`${API}/api/admin/overview`, { headers: { Authorization: auth } }).then(r=>safeJson(r, null)).catch(()=>null)
      : Promise.resolve(null);
    const pPayments = canBilling
      ? fetch(`${API}/api/admin/payments?limit=5`, { headers: { Authorization: auth } }).then(r=>safeJson(r, [])).catch(()=>[])
      : Promise.resolve([]);
    const pSupport = fetch(`${API}/api/admin/support?limit=5`, { headers: { Authorization: auth } }).then(r=>safeJson(r, [])).catch(()=>[]);
    const pRenewals = fetch(`${API}/api/admin/subscriptions?renewalsSoon=1&limit=5`, { headers: { Authorization: auth } }).then(r=>safeJson(r, [])).catch(()=>[]);
    Promise.all([pOverview, pPayments, pSupport, pRenewals])
      .then(([ov, pay, sup, ren]) => {
        setData(ov);
        setPayments(Array.isArray(pay) ? pay : []);
        setTickets(Array.isArray(sup) ? sup : []);
        setRenewals(Array.isArray(ren) ? ren : []);
        setLoading(false);
      })
      .catch((e)=>{ console.error(e); setError('Failed to load'); setLoading(false); });
  }, [reloadKey]);

  const hexToRgba = (hex, alpha = 1) => {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const KPI = ({ title, value, icon, color = '#4f46e5', delta, subtitle }) => (
    <Card style={{
      flex: '1 1 240px',
      borderRadius: 16,
      boxShadow: `0 8px 24px ${hexToRgba(color, 0.08)}`,
      overflow:'hidden',
      borderTop: `4px solid ${color}`,
      background: '#ffffff'
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{title}</div>
          <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.5 }}>{value}</div>
          {subtitle && <div style={{ color:'#6b7280', fontSize:12 }}>{subtitle}</div>}
        </div>
        <div style={{ width:44, height:44, borderRadius:12, display:'grid', placeItems:'center', color:'#0f172a', background:`${color}22` }}>
          <i className={`pi ${icon||'pi-chart-bar'}`} style={{ color, fontSize: 20 }} />
        </div>
      </div>
      {typeof delta === 'number' && (
        <div style={{ marginTop:10, display:'inline-flex', alignItems:'center', gap:6, padding:'4px 8px', borderRadius:999, background: (delta>=0?'#dcfce7':'#fee2e2'), color:(delta>=0?'#166534':'#991b1b'), fontSize:12, fontWeight:700 }}>
          <i className={`pi ${delta>=0?'pi-arrow-up':'pi-arrow-down'}`} /> {Math.abs(delta)}%
          <span style={{ color:'#6b7280', fontWeight:600 }}> vs prev</span>
        </div>
      )}
    </Card>
  );

  const pctDelta = (arr) => {
    if (!Array.isArray(arr) || arr.length < 2) return null;
    const a = Number(arr[arr.length-2]||0); const b = Number(arr[arr.length-1]||0);
    if (a === 0) return null;
    return Math.round(((b - a) / Math.abs(a)) * 100);
  };

  const trendData = (data && data.trends) ? {
    labels: data.trends.labels || [],
    datasets: [
      { label: 'Customers', data: data.trends.customers || [], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.2)', fill: true },
      { label: 'Active', data: data.trends.active || [], borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.2)', fill: true }
    ]
  } : { labels: [], datasets: [] };

  const customersDelta = pctDelta(data?.trends?.customers);
  const activeDelta = pctDelta(data?.trends?.active);

  const revenueData = (data && data.revenue) ? {
    labels: data.revenue.labels || [],
    datasets: [ { label: 'Revenue', data: data.revenue.amounts || [], backgroundColor: '#f59e0b' } ]
  } : { labels: [], datasets: [] };

  // Stacked revenue by plan removed per request

  // Common chart options for larger render area
  const chartOpts = React.useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } }
  }), []);

  // Chart heights
  const MAIN_H = 378;      // ~10% less than 420
  const SMALL_H = 306;     // ~10% less than 340

  // Status distribution pie
  const statusPie = React.useMemo(() => {
    const dist = data?.statusDist || {};
    const labels = Object.keys(dist);
    if (!labels.length) return null;
    const vals = labels.map(k => Number(dist[k] || 0));
    const colors = ['#10b981','#f59e0b','#ef4444','#3b82f6','#6b7280'];
    return { labels, datasets: [{ data: vals, backgroundColor: labels.map((_,i)=>colors[i%colors.length]) }] };
  }, [data]);

  // Plan mix doughnut
  const planDonut = React.useMemo(() => {
    const mix = data?.planMix || {};
    const labels = Object.keys(mix);
    if (!labels.length) return null;
    const vals = labels.map(k => Number(mix[k] || 0));
    const colors = ['#3b82f6','#10b981','#f59e0b','#8b5cf6','#ef4444','#6b7280'];
    return { labels, datasets: [{ data: vals, backgroundColor: labels.map((_,i)=>colors[i%colors.length]) }] };
  }, [data]);

  // Renewals breakdown bar
  const renewalsBar = React.useMemo(() => {
    const r = data?.renewals; if (!r) return null;
    const labels = ['Trial (All)','Trial (<=5 days)','Expired','Due Soon (<=5 days)'];
    const vals = [r.trialTotal||0, r.trialDueSoon||0, r.expired||0, r.dueSoon||0];
    return { labels, datasets: [{ label: 'Companies', data: vals, backgroundColor: ['#3b82f6','#10b981','#ef4444','#f59e0b'] }] };
  }, [data]);

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
        <div>
          <div style={{ fontSize:12, letterSpacing:1, color:'#64748b' }}>OVERVIEW</div>
          <h2 style={{ margin:'4px 0 0 0' }}>Dashboard</h2>
          <div style={{ color:'#6b7280', fontSize:12 }}>{new Date().toLocaleString()}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <select value={timeframe} onChange={(e)=>setTimeframe(e.target.value)} style={{ height:36, border:'1px solid #e5e7eb', borderRadius:8, padding:'0 10px' }}>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          <button onClick={()=>setReloadKey(k=>k+1)} style={{ height:36, borderRadius:8, border:'1px solid #e5e7eb', background:'#fff', padding:'0 12px', display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
            <i className="pi pi-refresh" /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop:12, background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', padding:'8px 12px', borderRadius:8, fontSize:13 }}>
          <i className="pi pi-exclamation-triangle" style={{ marginRight:6 }} /> {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12 }}>
        {loading ? (
          Array.from({ length: 6 }).map((_,i)=> (
            <div key={i} style={{ flex:'1 1 240px', height:108, background:'#f3f4f6', borderRadius:16, animation:'pulse 1.5s infinite' }} />
          ))
        ) : (
          <>
            <KPI title="Total Customers" value={data?.totals?.customers ?? 0} icon="pi-users" color="#3b82f6" delta={customersDelta} />
            <KPI title="Active Users" value={data?.totals?.activeUsers ?? 0} icon="pi-bolt" color="#10b981" delta={activeDelta} />
            <KPI title="Monthly Revenue" value={data?.totals?.monthlyRevenue ?? 0} icon="pi-wallet" color="#f59e0b" />
            <KPI title="Active Trials" value={data?.totals?.activeSubs ?? 0} icon="pi-clock" color="#8b5cf6" />
            <KPI title="Open Tickets" value={data?.totals?.openTickets ?? 0} icon="pi-inbox" color="#ef4444" />
            <KPI title="Pending Renewals" value={data?.totals?.pendingRenewals ?? 0} icon="pi-calendar" color="#0ea5e9" />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', marginTop: 16 }}>
        <Card title="Customer Growth" style={{ borderTop: '4px solid #3b82f6', borderRadius: 12 }}>
          <div style={{ height: MAIN_H }}>
            <Chart type="line" data={trendData} options={chartOpts} height={MAIN_H} />
          </div>
        </Card>
        <Card title="Monthly Revenue by Plan" style={{ borderTop: '4px solid #f59e0b', borderRadius: 12 }}>
          <div style={{ height: MAIN_H }}>
            <Chart type="bar" data={revenueData} options={chartOpts} height={MAIN_H} />
          </div>
        </Card>
      </div>

  {/* Stacked Revenue by Plan removed */}

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', marginTop: 16 }}>
        {statusPie && (
          <Card title="Status Distribution" style={{ borderTop: '4px solid #10b981', borderRadius: 12 }}>
            <div style={{ display:'flex', gap:16, alignItems:'stretch', height: SMALL_H }}>
              <div style={{ flex:'0 0 55%', minWidth: 240 }}>
                <Chart
                  type="pie"
                  data={statusPie}
                  options={{
                    ...chartOpts,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { display: false, grid: { display: false, drawBorder: false }, ticks: { display: false } },
                      y: { display: false, grid: { display: false, drawBorder: false }, ticks: { display: false } }
                    }
                  }}
                  height={SMALL_H}
                />
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, padding:8, overflow:'auto' }}>
                {statusPie.labels.map((label, idx) => {
                  const total = statusPie.datasets[0].data.reduce((a,b)=>a+b,0) || 1;
                  const val = statusPie.datasets[0].data[idx] || 0;
                  const pct = Math.round((val/total)*100);
                  const color = statusPie.datasets[0].backgroundColor[idx];
                  return (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:9999, background: color }} />
                        <span style={{ fontWeight:600 }}>{label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                        <span style={{ fontWeight:700 }}>{val}</span>
                        <span style={{ color:'#6b7280', fontSize:12 }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
        {planDonut && (
          <Card title="Plan Mix" style={{ borderTop: '4px solid #8b5cf6', borderRadius: 12 }}>
            <div style={{ display:'flex', gap:16, alignItems:'stretch', height: SMALL_H }}>
              <div style={{ flex:'0 0 55%', minWidth: 240 }}>
                <Chart
                  type="doughnut"
                  data={planDonut}
                  options={{
                    ...chartOpts,
                    cutout: '60%',
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { display: false, grid: { display: false, drawBorder: false }, ticks: { display: false } },
                      y: { display: false, grid: { display: false, drawBorder: false }, ticks: { display: false } }
                    }
                  }}
                  height={SMALL_H}
                />
              </div>
              <div style={{ flex:1, display:'flex', flexDirection:'column', gap:8, padding:8, overflow:'auto' }}>
                {planDonut.labels.map((label, idx) => {
                  const total = planDonut.datasets[0].data.reduce((a,b)=>a+b,0) || 1;
                  const val = planDonut.datasets[0].data[idx] || 0;
                  const pct = Math.round((val/total)*100);
                  const color = planDonut.datasets[0].backgroundColor[idx];
                  return (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', border:'1px solid #e5e7eb', borderRadius:8, padding:'8px 10px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ display:'inline-block', width:10, height:10, borderRadius:9999, background: color }} />
                        <span style={{ fontWeight:600 }}>{label}</span>
                      </div>
                      <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                        <span style={{ fontWeight:700 }}>{val}</span>
                        <span style={{ color:'#6b7280', fontSize:12 }}>{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        )}
        {renewalsBar && (
          <Card title="Renewals Snapshot" style={{ borderTop: '4px solid #0ea5e9', borderRadius: 12 }}>
            <div style={{ height: SMALL_H }}>
              <Chart type="bar" data={renewalsBar} options={chartOpts} height={SMALL_H} />
            </div>
          </Card>
        )}
      </div>

      <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', marginTop: 16 }}>
  <Card title="Recent Payments" style={{ borderTop: '4px solid #14b8a6', borderRadius: 12 }}>
          <DataTable value={Array.isArray(payments) ? payments : []} size="small" emptyMessage={loading ? 'Loading…' : 'No recent payments'}>
            <Column field="company_name" header="Company" />
            <Column field="status" header="Status" body={(row)=>{
              const v = (row.status||'').toLowerCase();
              const map = { paid:['#dcfce7','#065f46'], pending:['#fffbeb','#92400e'], failed:['#fee2e2','#991b1b'] };
              const [bg,fg] = map[v] || ['#e5e7eb','#374151'];
              return <span style={{ padding:'2px 6px', borderRadius:12, background:bg, color:fg, fontSize:12, fontWeight:700 }}>{row.status||'-'}</span>;
            }} />
            <Column field="amount" header="Amount" body={(row)=>{
              const amt = Number(row.amount||0);
              return <span style={{ fontWeight:700 }}>${amt.toLocaleString()}</span>;
            }} />
          </DataTable>
        </Card>
  <Card title="Upcoming Renewals" style={{ borderTop: '4px solid #38bdf8', borderRadius: 12 }}>
          <DataTable value={Array.isArray(renewals) ? renewals : []} size="small" emptyMessage={loading ? 'Loading…' : 'No upcoming renewals'}>
            <Column field="company_name" header="Company" />
            <Column field="plan" header="Plan" />
            <Column field="end_date" header="Renewal Date" />
          </DataTable>
        </Card>
  <Card title="Latest Support Tickets" style={{ borderTop: '4px solid #ef4444', borderRadius: 12 }}>
          <DataTable value={Array.isArray(tickets) ? tickets : []} size="small" emptyMessage={loading ? 'Loading…' : 'No tickets'}>
            <Column field="id" header="#" />
            <Column field="title" header="Title" />
            <Column field="email" header="Email" />
            <Column header="Priority" body={(row)=>{
              const v = (row.priority||'').toLowerCase();
              const map = { low:['#e5e7eb','#374151'], medium:['#fffbeb','#92400e'], high:['#fee2e2','#991b1b'] };
              const [bg,fg] = map[v] || ['#e5e7eb','#374151'];
              return <span style={{ padding:'2px 6px', borderRadius:12, background:bg, color:fg, fontSize:12, fontWeight:600 }}>{row.priority||'-'}</span>;
            }} />
            <Column header="Status" body={(row)=>{
              const v = (row.status||'').toLowerCase();
              const map = { open:['#dcfce7','#065f46'], in_progress:['#dbeafe','#1d4ed8'], closed:['#e5e7eb','#374151'], rejected:['#fee2e2','#991b1b'], resolved:['#dcfce7','#065f46'] };
              const [bg,fg] = map[v] || ['#e5e7eb','#374151'];
              return <span style={{ padding:'2px 6px', borderRadius:12, background:bg, color:fg, fontSize:12, fontWeight:600 }}>{row.status||'-'}</span>;
            }} />
            <Column header="Created" body={(row)=>{
              const d = row.created_at ? new Date(row.created_at) : null;
              return d ? d.toLocaleString() : '-';
            }} />
          </DataTable>
        </Card>
      </div>
    </div>
  );
}
