import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';

const API = process.env.REACT_APP_ADMIN_API;

export default function Settings() {
  const bearer = localStorage.getItem('jwt_token');
  const auth = `Bearer ${bearer}`;
  React.useEffect(()=>{ if (!bearer) window.location.href = '/login'; }, [bearer]);

  // Pricing plans
  const [plans, setPlans] = React.useState([]);
  const [planSelected, setPlanSelected] = React.useState(null);
  const [planQ, setPlanQ] = React.useState('');
  const [loadingPlans, setLoadingPlans] = React.useState(false);

  const loadPlans = React.useCallback(async ()=>{
    setLoadingPlans(true);
    try {
      const r = await fetch(`${API}/api/admin/pricing-plans`, { headers: { Authorization: auth } });
      const j = await r.json();
      setPlans(Array.isArray(j) ? j : []);
    } catch (e) { console.error(e); }
    setLoadingPlans(false);
  }, [auth]);
  // Important: don't pass an async function directly to useEffect (it returns a Promise)
  // Wrap the call so the effect returns undefined (no cleanup) instead of a Promise.
  React.useEffect(() => { loadPlans(); }, [loadPlans]);

  const planOptions = [
    { label: 'Basic', value: 'Basic' },
    { label: 'Professional', value: 'Professional' },
    { label: 'Enterprise', value: 'Enterprise' },
  ];
  const cycles = [ { label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' } ];
  const currencies = [ { label: 'INR', value: 'INR' }, { label:'USD', value:'USD' } ];

  const filteredPlans = React.useMemo(()=>{
    const q = planQ.trim().toLowerCase();
    return plans.filter(p => !q || p.plan_name?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q));
  }, [plans, planQ]);

  // Plan CRUD dialog
  const [planDlg, setPlanDlg] = React.useState(false);
  const [planMode, setPlanMode] = React.useState('create');
  const [planForm, setPlanForm] = React.useState({ plan_name:'Basic', billing_cycle:'monthly', price:0, currency:'INR', description:'' });
  const openAddPlan = () => { setPlanMode('create'); setPlanForm({ plan_name:'Basic', billing_cycle:'monthly', price:0, currency:'INR', description:'' }); setPlanDlg(true); };
  const openEditPlan = () => {
    if (!planSelected) return;
    setPlanMode('edit');
    setPlanForm({
      plan_name: planSelected.plan_name,
      billing_cycle: planSelected.billing_cycle,
      price: Number(planSelected.price||0),
      currency: planSelected.currency || 'INR',
      description: planSelected.description || ''
    });
    setPlanDlg(true);
  };
  const savePlan = async () => {
    try {
      const payload = { ...planForm, price: Number(planForm.price||0) };
      if (planMode === 'create') {
        const r = await fetch(`${API}/api/admin/pricing-plans`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Create failed');
      } else {
        const r = await fetch(`${API}/api/admin/pricing-plans/${planSelected.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Update failed');
      }
      setPlanDlg(false); await loadPlans();
    } catch (e) { console.error(e); }
  };
  const deletePlan = async () => {
    if (!planSelected) return;
    try {
      const r = await fetch(`${API}/api/admin/pricing-plans/${planSelected.id}`, { method:'DELETE', headers:{ Authorization: auth } });
      if (!r.ok) throw new Error('Delete failed');
      setPlanSelected(null); await loadPlans(); setFeatures([]); setFeatureSelected(null);
    } catch (e) { console.error(e); }
  };

  // Features
  const [features, setFeatures] = React.useState([]);
  const [featureSelected, setFeatureSelected] = React.useState(null);
  const [loadingFeatures, setLoadingFeatures] = React.useState(false);
  const loadFeatures = React.useCallback(async ()=>{
    if (!planSelected) { setFeatures([]); return; }
    setLoadingFeatures(true);
    try {
      const r = await fetch(`${API}/api/admin/pricing-plan-features?plan_id=${planSelected.id}`, { headers:{ Authorization: auth } });
      const j = await r.json();
      setFeatures(Array.isArray(j) ? j : []);
    } catch (e) { console.error(e); }
    setLoadingFeatures(false);
  }, [auth, planSelected]);
  React.useEffect(()=>{ loadFeatures(); }, [loadFeatures]);

  // Feature CRUD dialog
  const [featDlg, setFeatDlg] = React.useState(false);
  const [featMode, setFeatMode] = React.useState('create');
  const [featForm, setFeatForm] = React.useState({ feature_name:'', is_included:true, display_order:0 });
  const openAddFeature = () => { if (!planSelected) return; setFeatMode('create'); setFeatForm({ feature_name:'', is_included:true, display_order: (features.length? features.length:0) }); setFeatDlg(true); };
  const openEditFeature = () => {
    if (!featureSelected) return;
    setFeatMode('edit');
    setFeatForm({ feature_name: featureSelected.feature_name||'', is_included: !!featureSelected.is_included, display_order: Number(featureSelected.display_order||0) });
    setFeatDlg(true);
  };
  const saveFeature = async () => {
    if (!planSelected) return;
    try {
      const payload = { plan_id: planSelected.id, feature_name: (featForm.feature_name||'').trim(), is_included: !!featForm.is_included, display_order: Number(featForm.display_order||0) };
      if (!payload.feature_name) return;
      if (featMode === 'create') {
        const r = await fetch(`${API}/api/admin/pricing-plan-features`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Create failed');
      } else {
        const r = await fetch(`${API}/api/admin/pricing-plan-features/${featureSelected.id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization: auth }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('Update failed');
      }
      setFeatDlg(false); await loadFeatures();
    } catch (e) { console.error(e); }
  };
  const deleteFeature = async () => {
    if (!featureSelected) return;
    try {
      const r = await fetch(`${API}/api/admin/pricing-plan-features/${featureSelected.id}`, { method:'DELETE', headers:{ Authorization: auth } });
      if (!r.ok) throw new Error('Delete failed');
      setFeatureSelected(null); await loadFeatures();
    } catch (e) { console.error(e); }
  };

  const priceTemplate = (row) => <span>{row.currency || 'INR'} {Number(row.price||0).toFixed(2)}</span>;
  const badge = (txt, bg, fg) => <span style={{ padding:'2px 8px', borderRadius:999, fontSize:12, background:bg, color:fg, fontWeight:600 }}>{txt}</span>;

  return (
    <div>
      <h2>Settings</h2>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: 12, alignItems:'start' }}>
        {/* Plans panel */}
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ fontWeight:700 }}>Pricing Plans</div>
            <span style={{ marginLeft:'auto' }} />
            <div style={{ position:'relative', width:240 }}>
              <i className="pi pi-search" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
              <InputText value={planQ} onChange={(e)=>setPlanQ(e.target.value)} placeholder="Search plans" style={{ width:'100%', paddingLeft:32 }} />
            </div>
            <Button label="Add" icon="pi pi-plus" onClick={openAddPlan} />
            <Button label="Edit" icon="pi pi-pencil" onClick={openEditPlan} disabled={!planSelected} />
            <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={deletePlan} disabled={!planSelected} />
          </div>
          <DataTable value={filteredPlans} loading={loadingPlans} selectionMode="single" selection={planSelected} onSelectionChange={(e)=>setPlanSelected(e.value)} dataKey="id" paginator rows={5} rowsPerPageOptions={[5,10,20]} responsiveLayout="scroll">
            <Column field="plan_name" header="Plan" sortable></Column>
            <Column field="billing_cycle" header="Cycle" body={(r)=>badge(r.billing_cycle||'monthly', '#eef2ff', '#3730a3')} sortable></Column>
            <Column header="Price" body={priceTemplate} sortable></Column>
            <Column field="description" header="Description"></Column>
          </DataTable>
        </div>

        {/* Features panel */}
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ fontWeight:700 }}>Plan Features {planSelected ? `— ${planSelected.plan_name}` : ''}</div>
            <span style={{ marginLeft:'auto' }} />
            <Button label="Add" icon="pi pi-plus" onClick={openAddFeature} disabled={!planSelected} />
            <Button label="Edit" icon="pi pi-pencil" onClick={openEditFeature} disabled={!featureSelected} />
            <Button label="Delete" icon="pi pi-trash" severity="danger" onClick={deleteFeature} disabled={!featureSelected} />
          </div>
          {!planSelected && <div style={{ color:'#6b7280' }}>Select a plan to manage features.</div>}
          {planSelected && (
            <DataTable value={features} loading={loadingFeatures} selectionMode="single" selection={featureSelected} onSelectionChange={(e)=>setFeatureSelected(e.value)} dataKey="id" responsiveLayout="scroll">
              <Column field="feature_name" header="Feature" sortable></Column>
              <Column header="Included" body={(r)=> r.is_included ? badge('Yes', '#dcfce7', '#065f46') : badge('No', '#fee2e2', '#991b1b')} sortable></Column>
              <Column field="display_order" header="Order" sortable></Column>
            </DataTable>
          )}
        </div>
      </div>

      {/* Plan dialog */}
      <Dialog header={planMode==='create' ? 'Add Pricing Plan' : 'Edit Pricing Plan'} visible={planDlg} style={{ width: 520 }} onHide={()=>setPlanDlg(false)}>
        <div style={{ display:'grid', gap:10 }}>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Plan Name</div>
            <Dropdown options={planOptions} value={planForm.plan_name} onChange={(e)=>setPlanForm(f=>({...f, plan_name:e.value}))} style={{ width:'100%' }} />
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Billing Cycle</div>
            <Dropdown options={cycles} value={planForm.billing_cycle} onChange={(e)=>setPlanForm(f=>({...f, billing_cycle:e.value}))} style={{ width:'100%' }} />
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Price</div>
            <InputText value={planForm.price} onChange={(e)=>setPlanForm(f=>({...f, price:e.target.value}))} placeholder="0.00" />
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Currency</div>
            <Dropdown options={currencies} value={planForm.currency} onChange={(e)=>setPlanForm(f=>({...f, currency:e.value}))} style={{ width:'100%' }} />
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Description</div>
            <InputText value={planForm.description} onChange={(e)=>setPlanForm(f=>({...f, description:e.target.value}))} placeholder="Description" />
          </label>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <Button label="Cancel" onClick={()=>setPlanDlg(false)} />
          <Button label="Save" icon="pi pi-check" severity="success" onClick={savePlan} />
        </div>
      </Dialog>

      {/* Feature dialog */}
      <Dialog header={featMode==='create' ? 'Add Feature' : 'Edit Feature'} visible={featDlg} style={{ width: 520 }} onHide={()=>setFeatDlg(false)}>
        <div style={{ display:'grid', gap:10 }}>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Feature Name</div>
            <InputText value={featForm.feature_name} onChange={(e)=>setFeatForm(f=>({...f, feature_name:e.target.value}))} placeholder="e.g., Unlimited Check-ins" />
          </label>
          <label style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Checkbox checked={featForm.is_included} onChange={(e)=>setFeatForm(f=>({...f, is_included:e.checked}))} />
            <span>Included in plan</span>
          </label>
          <label>
            <div style={{ fontSize:12, color:'#6b7280' }}>Display Order</div>
            <InputText value={featForm.display_order} onChange={(e)=>setFeatForm(f=>({...f, display_order:e.target.value}))} placeholder="0" />
          </label>
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginTop:12 }}>
          <Button label="Cancel" onClick={()=>setFeatDlg(false)} />
          <Button label="Save" icon="pi pi-check" severity="success" onClick={saveFeature} />
        </div>
      </Dialog>
    </div>
  );
}
