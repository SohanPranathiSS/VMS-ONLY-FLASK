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

export default function Users() {
  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [q, setQ] = React.useState('');
  const [role, setRole] = React.useState('ALL');
  const [active, setActive] = React.useState('ALL');
  const bearer = localStorage.getItem('jwt_token');
  const auth = `Bearer ${bearer}`;
  React.useEffect(()=>{ if (!bearer) window.location.href = '/login'; }, [bearer]);

  const load = React.useCallback(() => {
    fetch(`${API}/api/admin/admin-users`, { headers: { Authorization: auth } })
      .then(r=>r.json())
      .then(j => {
        const arr = Array.isArray(j) ? j : (j && Array.isArray(j.data) ? j.data : []);
        setItems(arr);
      })
      .catch(err => { console.error(err); setItems([]); });
  }, [auth]);
  React.useEffect(load, [load]);

  const roles = [
    { label: 'All Roles', value: 'ALL' },
    { label: 'admin', value: 'admin' },
    { label: 'ops', value: 'ops' },
    { label: 'finance', value: 'finance' },
    { label: 'support', value: 'support' },
    { label: 'readonly', value: 'readonly' }
  ];
  const statuses = [
    { label: 'Any', value: 'ALL' },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false }
  ];

  const filtered = React.useMemo(() => {
    const ql = q.trim().toLowerCase();
    const list = Array.isArray(items) ? items : [];
    return list.filter(it => {
      const matchQ = !ql || (
        it.name?.toLowerCase().includes(ql) ||
        it.email?.toLowerCase().includes(ql) ||
        it.company_name?.toLowerCase().includes(ql) ||
        it.department?.toLowerCase().includes(ql) ||
        it.designation?.toLowerCase().includes(ql)
      );
      const matchRole = role === 'ALL' || it.role === role;
      const matchActive = active === 'ALL' || Boolean(it.is_active) === active;
      return matchQ && matchRole && matchActive;
    });
  }, [items, q, role, active]);

  // Summary cards
  const counts = React.useMemo(()=>{
    const total = filtered.length;
    const activeC = filtered.filter(u=>Boolean(u.is_active)).length;
    const inactiveC = total - activeC;
    const admins = filtered.filter(u=> (u.role||'').toLowerCase()==='admin').length;
    return { total, activeC, inactiveC, admins };
  }, [filtered]);

  // Badge/pill helpers
  const pill = (text, bg, color) => (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius: 999, background:bg, color, fontSize:12, fontWeight:600 }}>{text}</span>
  );
  const roleTemplate = (row) => {
    const v = (row.role||'').toLowerCase();
    const map = { admin:['#dbeafe','#1d4ed8'], ops:['#e0f2fe','#0369a1'], finance:['#fef3c7','#92400e'], support:['#ede9fe','#4c1d95'], readonly:['#e5e7eb','#374151'] };
    const [bg, fg] = map[v] || ['#e5e7eb','#374151'];
    return pill(row.role || '-', bg, fg);
  };
  const activeTemplate = (row) => row.is_active ? pill('Active', '#dcfce7', '#065f46') : pill('Inactive', '#e5e7eb', '#374151');
  const permsTemplate = (row) => {
    let txt = '';
    try {
      const p = row.permissions;
      if (!p) txt = '';
      else if (Array.isArray(p)) txt = p.join(', ');
      else if (typeof p === 'string') {
        const s = p.trim();
        if (s.startsWith('[')) txt = (JSON.parse(s)||[]).join(', ');
        else txt = s;
      }
    } catch (e) { txt = String(row.permissions||''); }
    if (txt === "*" || txt.includes('*')) return pill('*', '#fef3c7', '#92400e');
    const parts = txt ? txt.split(/\s*,\s*/).filter(Boolean) : [];
    if (parts.length === 0) return <span style={{ color:'#6b7280' }}>—</span>;
    return (
      <div style={{ display:'flex', flexWrap:'wrap', gap:6, maxWidth:420 }}>
        {parts.slice(0,6).map((t,i)=>(<span key={i} style={{ fontSize:11, background:'#f3f4f6', color:'#374151', borderRadius:999, padding:'1px 6px' }}>{t}</span>))}
        {parts.length>6 && <span style={{ fontSize:11, color:'#6b7280' }}>+{parts.length-6}</span>}
      </div>
    );
  };

  // CRUD modal
  const [formOpen, setFormOpen] = React.useState(false);
  const [formMode, setFormMode] = React.useState('create'); // 'create' | 'edit'
  const [form, setForm] = React.useState({ name:'', email:'', role:'readonly', is_active:true, password:'' });
  const [showPwd, setShowPwd] = React.useState(false);
  const openAdd = () => { setFormMode('create'); setForm({ name:'', email:'', role:'readonly', is_active:true, password:'' }); setFormOpen(true); };
  const openEdit = () => {
    if (!selected) return;
    setFormMode('edit');
    setForm({ name: selected.name||'', email: selected.email||'', role: (selected.role||'readonly'), is_active: !!selected.is_active, password:'' });
    setFormOpen(true);
  };
  const saveForm = async () => {
  const payload = { name: form.name, email: form.email, role: form.role, is_active: form.is_active, password: form.password };
    try {
      if (formMode==='create') {
        const r = await fetch(`${API}/api/admin/admin-users`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Create failed');
      } else {
        const r = await fetch(`${API}/api/admin/admin-users/${selected.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Update failed');
      }
      setFormOpen(false); load();
    } catch (e) { console.error(e); }
  };
  const toggleActive = async () => {
    if (!selected) return;
    try {
      await fetch(`${API}/api/admin/admin-users/${selected.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify({ is_active: !selected.is_active }) });
      load();
    } catch (e) { console.error(e); }
  };
  const [delOpen, setDelOpen] = React.useState(false);
  const openDelete = () => { if (!selected) return; setDelOpen(true); };
  const confirmDelete = async () => {
    if (!selected) return; try {
      await fetch(`${API}/api/admin/admin-users/${selected.id}`, { method:'DELETE', headers:{ Authorization: auth } });
      setDelOpen(false); load();
    } catch (e) { console.error(e); }
  };

  return (
    <div>
      <h2>Users</h2>
      {!hasPerm('users:view') && (<div style={{ color: 'crimson' }}>You do not have permission to view users.</div>)}
      {hasPerm('users:view') && (
      <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position:'relative', width: 320, maxWidth:'100%' }}>
          <i className="pi pi-search" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
          <InputText
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key==='Escape') setQ(''); }}
            placeholder="Search users"
            aria-label="Search users"
            style={{ width:'100%', paddingLeft:36, paddingRight:32, borderRadius:999, height:36, boxShadow:'inset 0 0 0 1px #e5e7eb' }}
          />
          {q && <i className="pi pi-times" title="Clear" onClick={()=>setQ('')} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af' }} />}
        </div>
        <Dropdown options={roles} value={role} onChange={(e)=>setRole(e.value)} placeholder="Role" style={{ width: 180 }} />
        <Dropdown options={statuses} value={active} onChange={(e)=>setActive(e.value)} placeholder="Status" style={{ width: 180 }} />
  <Button label="Clear" outlined onClick={()=>{ setQ(''); setRole('ALL'); setActive('ALL'); }} />
        <span style={{ marginLeft: 'auto' }} />
  <Button label="Add" icon="pi pi-plus" onClick={openAdd} />
  <Button label="Edit" icon="pi pi-pencil" onClick={openEdit} disabled={!selected} />
  <Button label={selected && selected.is_active ? 'Deactivate' : 'Activate'} icon="pi pi-power-off" severity="warning" onClick={toggleActive} disabled={!selected} />
  <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={openDelete} disabled={!selected} />
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:12 }}>
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>Total Users</div>
          <div style={{ fontWeight:700, fontSize:18 }}>{counts.total}</div>
        </div>
        <div style={{ background:'#dcfce7', border:'1px solid #a7f3d0', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#065f46' }}>Active</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#065f46' }}>{counts.activeC}</div>
        </div>
        <div style={{ background:'#e5e7eb', border:'1px solid #d1d5db', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#374151' }}>Inactive</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#374151' }}>{counts.inactiveC}</div>
        </div>
        <div style={{ background:'#dbeafe', border:'1px solid #bfdbfe', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#1d4ed8' }}>Admins</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#1d4ed8' }}>{counts.admins}</div>
        </div>
      </div>
      <DataTable value={filtered} paginator rows={10} rowsPerPageOptions={[10,20,50]} responsiveLayout="scroll" selectionMode="single" selection={selected} onSelectionChange={(e)=>setSelected(e.value)} dataKey="id">
        <Column field="name" header="Name" sortable></Column>
        <Column field="email" header="Email" sortable></Column>
        <Column header="Role" body={roleTemplate} sortable></Column>
        <Column header="Permissions" body={permsTemplate}></Column>
        <Column header="Active" body={activeTemplate}></Column>
      </DataTable>

      <Dialog header={formMode==='create'? 'Add Admin User' : 'Edit Admin User'} visible={formOpen} style={{ width: 520 }} onHide={()=>setFormOpen(false)}>
        <div style={{ display:'grid', gap:10 }}>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Name</div>
            <InputText value={form.name} onChange={(e)=>setForm(f=>({...f, name:e.target.value}))} placeholder="Full name" />
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Email</div>
            <InputText value={form.email} onChange={(e)=>setForm(f=>({...f, email:e.target.value}))} placeholder="Email" />
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Role</div>
            <Dropdown options={roles.filter(r=>r.value!=='ALL')} value={form.role} onChange={(e)=>setForm(f=>({...f, role:e.value}))} style={{ width:'100%' }} />
          </label>
          {/* Permissions removed: backend now assigns based on role automatically */}
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Checkbox checked={form.is_active} onChange={(e)=>setForm(f=>({...f, is_active:e.checked}))} />
            <span>Active</span>
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>{formMode==='create' ? 'Password' : 'Password (leave blank to keep current)'}</div>
            <div style={{ position:'relative' }}>
              <InputText type={showPwd ? 'text' : 'password'} value={form.password} onChange={(e)=>setForm(f=>({...f, password:e.target.value}))} placeholder="Password" style={{ width:'100%', paddingRight:36 }} />
              <i
                className={`pi ${showPwd ? 'pi-eye-slash' : 'pi-eye'}`}
                onClick={()=>setShowPwd(s=>!s)}
                title={showPwd ? 'Hide password' : 'Show password'}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af' }}
              />
            </div>
          </label>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <Button label="Cancel" onClick={()=>setFormOpen(false)} />
          <Button label="Save" icon="pi pi-check" severity="success" onClick={saveForm} />
        </div>
      </Dialog>

      <Dialog header="Delete Admin User" visible={delOpen} style={{ width: 420 }} onHide={()=>setDelOpen(false)}>
        <div>Are you sure you want to permanently delete <strong>{selected?.email}</strong>? This action cannot be undone.</div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <Button label="Cancel" onClick={()=>setDelOpen(false)} />
          <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={confirmDelete} />
        </div>
      </Dialog>
      </>)
      }
    </div>
  );
}
