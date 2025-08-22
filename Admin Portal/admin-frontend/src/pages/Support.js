import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import { hasPerm } from '../utils/auth';

const API = process.env.REACT_APP_ADMIN_API;

export default function Support() {
  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState(null);
  const [priority, setPriority] = React.useState(null);
  const bearer = localStorage.getItem('jwt_token');
  const auth = `Bearer ${bearer}`;
  React.useEffect(()=>{ if (!bearer) window.location.href = '/login'; }, [bearer]);

  const load = () => {
    fetch(`${API}/api/admin/support`, { headers: { Authorization: auth } })
      .then(r=>r.json())
      .then(j => setItems(Array.isArray(j) ? j : (j && Array.isArray(j.data) ? j.data : [])))
      .catch(err => { console.error(err); setItems([]); });
  };

  React.useEffect(load, []);

  // Assignment modal state
  const [assignOpen, setAssignOpen] = React.useState(false);
  const [admins, setAdmins] = React.useState([]);
  const [selectedAdmins, setSelectedAdmins] = React.useState([]);

  const openAssign = async () => {
    if (!selected) return;
    setAssignOpen(true);
    try {
      const res = await fetch(`${API}/api/admin/admin-users`, { headers: { Authorization: auth } });
      const data = await res.json();
      setAdmins(Array.isArray(data) ? data : []);
      // Preselect from row if assigned_to has IDs
      const current = String(selected.assigned_to || '').split(',').map(s=>parseInt(s)).filter(n=>!isNaN(n));
      setSelectedAdmins(current);
    } catch (e) { console.error(e); }
  };

  const toggleAdmin = (id, checked) => {
    setSelectedAdmins(prev => {
      const set = new Set(prev);
      if (checked) set.add(id); else set.delete(id);
      return Array.from(set);
    });
  };

  const submitAssign = async () => {
    if (!selected) return;
    try {
      await fetch(`${API}/api/admin/support/${selected.id}/assign`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ assigned_to_ids: selectedAdmins })
      });
      setAssignOpen(false);
      setSelectedAdmins([]);
      load();
    } catch (e) { console.error(e); }
  };

  const statuses = [ {label: 'Any', value: null}, 'open','in_progress','closed','rejected' ].map(s=> typeof s==='string'?{label:s,value:s}:s);
  const priorities = [ {label: 'Any', value: null}, 'low','medium','high' ].map(s=> typeof s==='string'?{label:s,value:s}:s);
  const filtered = React.useMemo(()=>{
    const ql = q.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    return list.filter(t => {
      const text = [t.title, t.email, t.description, t.message].filter(Boolean).map(String).join(' ').toLowerCase();
      const matchQ = !ql || text.includes(ql);
      const matchS = !status || (t.status||'').toLowerCase()===status;
      const matchP = !priority || (t.priority||'').toLowerCase()===priority;
      return matchQ && matchS && matchP;
    });
  }, [items, q, status, priority]);

  // Pills/badges
  const pill = (text, bg, color) => (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius: 999, background:bg, color, fontSize:12, fontWeight:600 }}>
      {text}
    </span>
  );
  const statusTemplate = (row) => {
    const v = (row.status||'').toLowerCase();
    const map = { open:['#dbeafe','#1d4ed8'], in_progress:['#fffbeb','#92400e'], closed:['#e5e7eb','#374151'], rejected:['#fee2e2','#991b1b'] };
    const [bg, fg] = map[v] || ['#e5e7eb','#374151'];
    const label = v ? v.replace('_',' ') : '-';
    return pill(label, bg, fg);
  };
  const priorityTemplate = (row) => {
    const v = (row.priority||'').toLowerCase();
    const map = { low:['#dcfce7','#065f46'], medium:['#fffbeb','#92400e'], high:['#fee2e2','#991b1b'] };
    const [bg, fg] = map[v] || ['#e5e7eb','#374151'];
    return pill(v || '-', bg, fg);
  };

  // Dates
  const formatDate = (s) => {
    if (!s) return '-';
    const d = new Date(s);
    if (isNaN(d)) return String(s);
    return d.toISOString().slice(0,10);
  };
  const relative = (s) => {
    if (!s) return '';
    const d = new Date(s); if (isNaN(d)) return '';
    const ms = Date.now() - d.getTime();
    const abs = Math.abs(ms);
    const day = 86400000, hour = 3600000, min = 60000;
    if (abs >= day) { const n = Math.round(abs/day); return ms >=0 ? `${n}d ago` : `in ${n}d`; }
    if (abs >= hour) { const n = Math.round(abs/hour); return ms >=0 ? `${n}h ago` : `in ${n}h`; }
    if (abs >= min) { const n = Math.round(abs/min); return ms >=0 ? `${n}m ago` : `in ${n}m`; }
    return 'just now';
  };
  const createdTemplate = (row) => {
    const d = row.created_at || row.createdAt;
    const base = formatDate(d);
    const rel = relative(d);
    return <span>{base}{rel?` · ${rel}`:''}</span>;
  };
  const descriptionTemplate = (row) => {
    const full = String(row.description ?? row.message ?? '').trim();
    if (!full) return '-';
    const max = 140;
    const short = full.length > max ? full.slice(0, max) + '…' : full;
    return <span title={full} style={{ whiteSpace:'normal', display:'inline-block', maxWidth: 480 }}>{short}</span>;
  };

  const onAssign = () => { if (!selected) return; alert('Assign ticket placeholder #' + selected.id); };
  // Status modal state
  const [statusOpen, setStatusOpen] = React.useState(false);
  const [nextStatus, setNextStatus] = React.useState('open');
  const openStatus = () => {
    if (!selected) return;
    setNextStatus((selected.status||'open').toLowerCase());
    setStatusOpen(true);
  };
  const submitStatus = async () => {
    if (!selected) return;
    try {
      await fetch(`${API}/api/admin/support/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: auth },
        body: JSON.stringify({ status: nextStatus })
      });
      setStatusOpen(false);
      load();
    } catch (e) { console.error(e); }
  };

  // Summary cards from filtered
  const counts = React.useMemo(()=>{
    const total = filtered.length;
    const open = filtered.filter(t=> (t.status||'').toLowerCase()==='open').length;
    const inprog = filtered.filter(t=> (t.status||'').toLowerCase()==='in_progress').length;
    const closed = filtered.filter(t=> (t.status||'').toLowerCase()==='closed').length;
    const high = filtered.filter(t=> (t.priority||'').toLowerCase()==='high').length;
    return { total, open, inprog, closed, high };
  }, [filtered]);

  return (
    <div>
      <h2>Support Tickets</h2>
      {!hasPerm('support:view') && (<div style={{ color: 'crimson' }}>You do not have permission to view support tickets.</div>)}
      {hasPerm('support:view') && (
      <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position:'relative', width: 340, maxWidth: '100%' }}>
          <i className="pi pi-search" style={{ position:'absolute', left: 12, top: '50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
          <InputText
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==='Escape') setQ(''); }}
            placeholder="Search by title/email"
            aria-label="Search tickets"
            style={{ width:'100%', paddingLeft: 36, paddingRight: 32, borderRadius: 999, height: 36, boxShadow:'inset 0 0 0 1px #e5e7eb' }}
          />
          {q && (
            <i className="pi pi-times" title="Clear" onClick={()=>setQ('')} style={{ position:'absolute', right: 10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af' }} />
          )}
        </div>
        <Dropdown options={statuses} value={status} onChange={(e)=>setStatus(e.value)} placeholder="Status" style={{ width: 180 }} />
        <Dropdown options={priorities} value={priority} onChange={(e)=>setPriority(e.value)} placeholder="Priority" style={{ width: 180 }} />
        <Button label="Clear" outlined onClick={()=>{ setQ(''); setStatus(null); setPriority(null); }} />
        <span style={{ marginLeft: 'auto' }} />
  <Button label="Assign" icon="pi pi-user-plus" onClick={openAssign} disabled={!selected} />
  <Button label="Status" icon="pi pi-check" severity="success" onClick={openStatus} disabled={!selected} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:12 }}>
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>Total</div>
          <div style={{ fontWeight:700, fontSize:18 }}>{counts.total}</div>
        </div>
        <div style={{ background:'#dbeafe', border:'1px solid #bfdbfe', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#1d4ed8' }}>Open</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#1d4ed8' }}>{counts.open}</div>
        </div>
        <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#92400e' }}>In Progress</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#92400e' }}>{counts.inprog}</div>
        </div>
        <div style={{ background:'#e5e7eb', border:'1px solid #d1d5db', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#374151' }}>Closed</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#374151' }}>{counts.closed}</div>
        </div>
        <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#991b1b' }}>High Priority</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#991b1b' }}>{counts.high}</div>
        </div>
      </div>

      <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10,20,50]} responsiveLayout="scroll" selectionMode="single" selection={selected} onSelectionChange={(e)=>setSelected(e.value)} dataKey="id">
        <Column field="id" header="#" sortable></Column>
        <Column field="title" header="Title"></Column>
        <Column header="Description" body={descriptionTemplate}></Column>
        <Column field="email" header="Email"></Column>
        <Column header="Priority" body={priorityTemplate}></Column>
        <Column header="Status" body={statusTemplate} sortable></Column>
        <Column field="assigned_to" header="Assigned"></Column>
        <Column header="Created" body={createdTemplate}></Column>
      </DataTable>

      <Dialog header="Update Status" visible={statusOpen} style={{ width: 420 }} onHide={()=>setStatusOpen(false)}>
        <div style={{ display:'grid', gap:8 }}>
          {['open','in_progress','resolved','closed','rejected'].map(s => (
            <label key={s} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 2px' }}>
              <input type="radio" name="ticket-status" value={s} checked={nextStatus===s} onChange={()=>setNextStatus(s)} />
              <span style={{ textTransform:'capitalize' }}>{s.replace('_',' ')}</span>
            </label>
          ))}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <Button label="Cancel" onClick={()=>setStatusOpen(false)} />
          <Button label="Save" icon="pi pi-check" severity="success" onClick={submitStatus} />
        </div>
      </Dialog>

      <Dialog header="Assign Ticket" visible={assignOpen} style={{ width: '520px' }} onHide={()=>setAssignOpen(false)}>
        <div style={{ maxHeight: 360, overflow: 'auto', paddingRight: 8 }}>
          {admins.map(a => (
            <label key={a.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 2px', borderBottom:'1px solid #f3f4f6' }}>
              <Checkbox inputId={`adm-${a.id}`} checked={selectedAdmins.includes(a.id)} onChange={(e)=>toggleAdmin(a.id, e.checked)} />
              <span style={{ fontWeight:600 }}>{a.name}</span>
              <span style={{ color:'#6b7280' }}>#{a.id}</span>
              <span style={{ marginLeft:'auto', color:'#374151' }}>{a.email}</span>
            </label>
          ))}
          {admins.length===0 && <div style={{ color:'#6b7280' }}>No active admins found.</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <Button label="Cancel" onClick={()=>setAssignOpen(false)} />
          <Button label="Assign" icon="pi pi-check" severity="success" onClick={submitAssign} disabled={selectedAdmins.length===0} />
        </div>
      </Dialog>
      </>)
      }
    </div>
  );
}
