import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { hasPerm } from '../utils/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Dialog } from 'primereact/dialog';

const API = process.env.REACT_APP_ADMIN_API;

export default function Billing() {
  const [subs, setSubs] = React.useState([]);
  const [payments, setPayments] = React.useState([]);
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('ALL');
  const [plan, setPlan] = React.useState('ALL'); // subscription plan/cycle (free/monthly/yearly/enterprise)
  const [planType, setPlanType] = React.useState('ALL'); // Basic/Professional/Enterprise
  const [invoiceVisible, setInvoiceVisible] = React.useState(false);
  const [invoiceData, setInvoiceData] = React.useState(null);
  const bearer = localStorage.getItem('jwt_token');
  const auth = `Bearer ${bearer}`;
  React.useEffect(()=>{ if (!bearer) window.location.href = '/login'; }, [bearer]);

  React.useEffect(() => {
    Promise.all([
      fetch(`${API}/api/admin/subscriptions`, { headers: { Authorization: auth } }).then(r=>r.json()),
      fetch(`${API}/api/admin/payments`, { headers: { Authorization: auth } }).then(r=>r.json()),
    ]).then(([a,b])=>{
      const sa = Array.isArray(a) ? a : (a && Array.isArray(a.data) ? a.data : []);
      const pb = Array.isArray(b) ? b : (b && Array.isArray(b.data) ? b.data : []);
      setSubs(sa); setPayments(pb);
    }).catch(err => { console.error(err); setSubs([]); setPayments([]); });
  }, []);

  // Plan cycle options
  const plans = [ { label: 'All Plans', value: 'ALL' }, 'monthly','yearly','enterprise' ].map(p=> typeof p==='string'?{label:p,value:p}:p);
  const planTypes = [ { label: 'All Plan Types', value: 'ALL' }, 'Basic','Professional','Enterprise' ].map(p=> typeof p==='string'?{label:p,value:p}:p);
  const statuses = [ { label: 'Any', value: 'ALL' }, 'active','expired','cancelled','created','paid','failed' ].map(s=>typeof s==='string'?{label:s,value:s}:s);

  const exportCsv = (rows, name) => {
    const keys = rows.length ? Object.keys(rows[0]) : [];
    const csv = [keys.join(',')].concat(rows.map(r=>keys.map(k=>`"${String(r[k]??'').replace(/"/g,'""')}"`).join(','))).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${name}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  const getPlanType = (row) => {
    const v = row?.plan_type ?? row?.planType ?? row?.plan_name ?? row?.planName;
    if (!v) return null;
    const s = String(v).toLowerCase();
    if (s.includes('basic')) return 'Basic';
    if (s.includes('professional') || s.includes('pro')) return 'Professional';
    if (s.includes('enterprise') || s.includes('ent')) return 'Enterprise';
    return null;
  };

  const filteredSubs = React.useMemo(()=>{
    const ql = q.trim().toLowerCase();
    const list = Array.isArray(subs) ? subs : [];
    return list.filter(s => {
      const matchQ = (!ql || s.company_name?.toLowerCase().includes(ql));
  const matchPlan = (plan === 'ALL' || s.plan === plan);
  const matchStatus = (status === 'ALL' || s.status === status);
      const pt = getPlanType(s);
  const matchPlanType = (planType === 'ALL' || pt === planType);
      return matchQ && matchPlan && matchStatus && matchPlanType;
    });
  }, [subs, q, plan, status, planType]);
  const filteredPays = React.useMemo(()=>{
    const ql = q.trim().toLowerCase();
    const list = Array.isArray(payments) ? payments : [];
    return list.filter(p => {
      const matchQ = (!ql || p.company_name?.toLowerCase().includes(ql));
  const matchStatus = (status === 'ALL' || p.status === status);
  const matchPlan = (plan === 'ALL' || p.plan === plan);
      const pt = getPlanType(p);
  const matchPlanType = (planType === 'ALL' || pt === planType);
      return matchQ && matchStatus && matchPlan && matchPlanType;
    });
  }, [payments, q, status, plan, planType]);

  const planTypeTemplate = (row) => getPlanType(row) || '-';
  // Shared pill renderer
  const pill = (text, bg, color) => (
    <span style={{ display:'inline-block', padding:'2px 8px', borderRadius: 999, background:bg, color, fontSize:12, fontWeight:600 }}>
      {text}
    </span>
  );
  // Cycle (plan) badge
  const planCycleTemplate = (row) => {
    const v = row.plan || 'free';
    const map = { free:['#e5e7eb','#111827'], monthly:['#dbeafe','#1d4ed8'], yearly:['#dcfce7','#065f46'], enterprise:['#ede9fe','#4c1d95'] };
    const [bg, fg] = map[v] || map.free; return pill(v, bg, fg);
  };
  // Subscriptions status badge
  const statusTemplateSub = (row) => {
    const v = (row.status||'').toLowerCase();
    const map = { active:['#dcfce7','#065f46'], expired:['#fee2e2','#991b1b'], cancelled:['#e5e7eb','#374151'] };
    const [bg, fg] = map[v] || ['#e5e7eb','#374151']; return pill(row.status || '-', bg, fg);
  };
  // Payments status badge
  const statusTemplatePay = (row) => {
    const v = (row.status||'').toLowerCase();
    const map = { paid:['#dcfce7','#065f46'], failed:['#fee2e2','#991b1b'], created:['#fffbeb','#92400e'] };
    const [bg, fg] = map[v] || ['#e5e7eb','#374151']; return pill(row.status || '-', bg, fg);
  };

  // Summary cards
  const subsCounts = React.useMemo(()=>({
    total: filteredSubs.length,
    active: filteredSubs.filter(x=>x.status==='active').length,
    expired: filteredSubs.filter(x=>x.status==='expired').length,
    cancelled: filteredSubs.filter(x=>x.status==='cancelled').length,
  }), [filteredSubs]);
  const paysSummary = React.useMemo(()=>{
    const paid = filteredPays.filter(x=>x.status==='paid');
    const failed = filteredPays.filter(x=>x.status==='failed');
    const totalPaid = paid.reduce((sum, x)=> sum + (Number(x.amount)||0), 0);
    return { paidCount: paid.length, failedCount: failed.length, totalPaid };
  }, [filteredPays]);
  const invoiceTemplate = (row) => {
    const url = row?.invoice_url || row?.invoiceUrl;
    return (
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <a href="#" onClick={(e)=>{e.preventDefault(); setInvoiceData(row); setInvoiceVisible(true);}}>View</a>
        <Button label="Download" icon="pi pi-download" size="small" onClick={() => downloadInvoice(row)} />
        {url && <a href={url} target="_blank" rel="noreferrer" title="Open external invoice">Open</a>}
      </div>
    );
  };

  const downloadInvoice = (paymentRow) => {
    try {
      const doc = new jsPDF();
      const now = new Date();
      const company = paymentRow?.company_name || 'Unknown Company';
      const invoiceNo = paymentRow?.invoice_number || paymentRow?.invoiceNumber || `INV-${paymentRow?.id || Math.floor(Math.random()*1e6)}`;
      const currency = paymentRow?.currency || 'USD';
      const amount = Number(paymentRow?.amount || 0);
      const plan = paymentRow?.plan || '-';
      const planType = getPlanType(paymentRow) || '-';
      const status = (paymentRow?.status || '-').toUpperCase();
      const dateStr = paymentRow?.payment_date || paymentRow?.created_at || now.toISOString().slice(0,10);

      // Header
      doc.setFillColor(17,24,39); // slate-900
      doc.rect(0, 0, 210, 28, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(18);
      doc.setFont('helvetica','bold');
      doc.text('INVOICE', 14, 18);
      doc.setFontSize(10);
      doc.setFont('helvetica','normal');
      doc.text(`Date: ${now.toLocaleDateString()}`, 150, 10);
      doc.text(`Invoice #: ${invoiceNo}`, 150, 16);

      // From / To blocks
      doc.setTextColor(17,24,39);
      doc.setFontSize(12);
      doc.setFont('helvetica','bold');
      doc.text('From', 14, 40);
      doc.text('Bill To', 120, 40);
      doc.setFont('helvetica','normal');
      const appName = process.env.REACT_APP_NAME || 'Admin Portal';
      doc.setFontSize(11);
      doc.text(`${appName}\nSupport: support@example.com`, 14, 46);
      doc.text(`${company}\nPlan: ${planType} (${plan})`, 120, 46);

      // Payment summary table
      autoTable(doc, {
        startY: 72,
        head: [[ 'Description', 'Qty', 'Unit Price', 'Amount' ]],
        body: [
          [ `${planType} subscription (${plan})`, '1', `${currency} ${amount.toFixed(2)}`, `${currency} ${amount.toFixed(2)}` ],
        ],
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [37,99,235] }, // blue-600
      });

      // Totals
  const y = (doc.lastAutoTable && doc.lastAutoTable.finalY ? doc.lastAutoTable.finalY : 100) + 10;
      doc.setFont('helvetica','bold');
      doc.text('Subtotal:', 150, y);
      doc.text(`${currency} ${amount.toFixed(2)}`, 180, y, { align: 'right' });
      doc.text('Total:', 150, y + 8);
      doc.text(`${currency} ${amount.toFixed(2)}`, 180, y + 8, { align: 'right' });
      doc.setFont('helvetica','normal');
      doc.text(`Payment status: ${status}`, 14, y + 8);

      // Footer
      doc.setFontSize(9);
      doc.setTextColor(75,85,99); // slate-600
      doc.text('Thank you for your business!', 14, 280);
      doc.text('This is a system-generated invoice.', 14, 286);

      const fname = `invoice_${company.replace(/[^a-z0-9]+/gi,'_')}_${invoiceNo}.pdf`;
      doc.save(fname);
    } catch (e) {
      console.error('Failed to export invoice', e);
      alert('Unable to generate invoice PDF.');
    }
  };

  const currencyFmt = (amt, ccy) => `${ccy||'USD'} ${Number(amt||0).toFixed(2)}`;
  const getInvoiceNumber = (row) => row?.invoice_number || row?.invoiceNumber || `INV-${row?.id || Math.floor(Math.random()*1e6)}`;
  const InvoicePreview = ({ row }) => {
    if (!row) return null;
    const company = row?.company_name || 'Unknown Company';
    const currency = row?.currency || 'USD';
    const amount = Number(row?.amount || 0);
    const plan = row?.plan || '-';
    const planType = getPlanType(row) || '-';
    const status = (row?.status || '-').toUpperCase();
    const dateStr = row?.payment_date || row?.created_at || new Date().toISOString().slice(0,10);
    const appName = process.env.REACT_APP_NAME || 'Admin Portal';
    const invoiceNo = getInvoiceNumber(row);
    return (
      <div style={{ fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #e5e7eb', paddingBottom:12 }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:1, color:'#64748b' }}>INVOICE</div>
            <div style={{ fontSize:22, fontWeight:800 }}>{invoiceNo}</div>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ color:'#6b7280', fontSize:12 }}>Date</div>
            <div style={{ fontWeight:700 }}>{new Date(dateStr).toLocaleDateString()}</div>
            <div style={{ marginTop:8, display:'inline-block', padding:'2px 8px', borderRadius:999, background: status==='PAID'?'#dcfce7':status==='FAILED'?'#fee2e2':'#e5e7eb', color: status==='PAID'?'#065f46':status==='FAILED'?'#991b1b':'#374151', fontSize:12, fontWeight:700 }}>{status}</div>
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:12 }}>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>From</div>
            <div style={{ fontWeight:700 }}>{appName}</div>
            <div style={{ color:'#6b7280' }}>support@example.com</div>
          </div>
          <div>
            <div style={{ fontSize:12, color:'#6b7280' }}>Bill To</div>
            <div style={{ fontWeight:700 }}>{company}</div>
            <div style={{ color:'#6b7280' }}>Plan: {planType} ({plan})</div>
          </div>
        </div>

        <div style={{ marginTop:16 }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ background:'#eff6ff', color:'#1d4ed8' }}>
                <th style={{ textAlign:'left', padding:'8px', border:'1px solid #e5e7eb' }}>Description</th>
                <th style={{ textAlign:'right', padding:'8px', border:'1px solid #e5e7eb' }}>Qty</th>
                <th style={{ textAlign:'right', padding:'8px', border:'1px solid #e5e7eb' }}>Unit Price</th>
                <th style={{ textAlign:'right', padding:'8px', border:'1px solid #e5e7eb' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding:'8px', border:'1px solid #e5e7eb' }}>{planType} subscription ({plan})</td>
                <td style={{ padding:'8px', border:'1px solid #e5e7eb', textAlign:'right' }}>1</td>
                <td style={{ padding:'8px', border:'1px solid #e5e7eb', textAlign:'right' }}>{currencyFmt(amount, currency)}</td>
                <td style={{ padding:'8px', border:'1px solid #e5e7eb', textAlign:'right' }}>{currencyFmt(amount, currency)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style={{ marginTop:12, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ minWidth:260 }}>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0' }}>
              <div style={{ color:'#6b7280' }}>Subtotal</div>
              <div style={{ fontWeight:700 }}>{currencyFmt(amount, currency)}</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderTop:'1px solid #e5e7eb', marginTop:4 }}>
              <div style={{ fontWeight:800 }}>Total</div>
              <div style={{ fontWeight:800 }}>{currencyFmt(amount, currency)}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop:16, color:'#6b7280', fontSize:12 }}>Thank you for your business!</div>
      </div>
    );
  };

  return (
    <div>
      <h2>Billing</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ position:'relative', width: 320, maxWidth: '100%' }}>
          <i className="pi pi-search" style={{ position:'absolute', left: 12, top: '50%', transform:'translateY(-50%)', color:'#9ca3af' }} />
          <InputText
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            onKeyDown={(e)=>{ if (e.key === 'Escape') setQ(''); }}
            placeholder="Search company"
            aria-label="Search company"
            style={{ width:'100%', paddingLeft: 36, paddingRight: 32, borderRadius: 999, height: 36, boxShadow:'inset 0 0 0 1px #e5e7eb' }}
          />
          {q && (
            <i className="pi pi-times" title="Clear" onClick={()=>setQ('')} style={{ position:'absolute', right: 10, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af' }} />
          )}
        </div>
        <Dropdown options={plans} value={plan} onChange={(e)=>setPlan(e.value)} placeholder="Plan (cycle)" style={{ width: 180 }} />
        <Dropdown options={planTypes} value={planType} onChange={(e)=>setPlanType(e.value)} placeholder="Plan Type" style={{ width: 200 }} />
        <Dropdown options={statuses} value={status} onChange={(e)=>setStatus(e.value)} placeholder="Status" style={{ width: 180 }} />
        <Button label="Clear" outlined onClick={()=>{ setQ(''); setPlan('ALL'); setPlanType('ALL'); setStatus('ALL'); }} />
        <span style={{ marginLeft: 'auto' }} />
        <Button label="Export Subscriptions" icon="pi pi-download" onClick={()=>exportCsv(filteredSubs, 'subscriptions')} />
        {hasPerm('billing:view') && <Button label="Export Payments" icon="pi pi-download" onClick={()=>exportCsv(filteredPays, 'payments')} />}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:12 }}>
        <div style={{ background:'#fff', border:'1px solid #eee', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#6b7280' }}>Subs Total</div>
          <div style={{ fontWeight:700, fontSize:18 }}>{subsCounts.total}</div>
        </div>
        <div style={{ background:'#dcfce7', border:'1px solid #a7f3d0', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#065f46' }}>Subs Active</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#065f46' }}>{subsCounts.active}</div>
        </div>
        <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#991b1b' }}>Subs Expired</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#991b1b' }}>{subsCounts.expired}</div>
        </div>
        <div style={{ background:'#e5e7eb', border:'1px solid #d1d5db', borderRadius:8, padding:10 }}>
          <div style={{ fontSize:12, color:'#374151' }}>Subs Cancelled</div>
          <div style={{ fontWeight:700, fontSize:18, color:'#374151' }}>{subsCounts.cancelled}</div>
        </div>
        {hasPerm('billing:view') && (
          <>
            <div style={{ background:'#dcfce7', border:'1px solid #a7f3d0', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#065f46' }}>Payments Paid</div>
              <div style={{ fontWeight:700, fontSize:18, color:'#065f46' }}>{paysSummary.paidCount}</div>
            </div>
            <div style={{ background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#991b1b' }}>Payments Failed</div>
              <div style={{ fontWeight:700, fontSize:18, color:'#991b1b' }}>{paysSummary.failedCount}</div>
            </div>
            <div style={{ background:'#fffbeb', border:'1px solid #a7f3d0', borderRadius:8, padding:10 }}>
              <div style={{ fontSize:12, color:'#065f46' }}>Paid Amount (sum)</div>
              <div style={{ fontWeight:700, fontSize:18, color:'#065f46' }}>{paysSummary.totalPaid.toFixed(2)}</div>
            </div>
          </>
        )}
      </div>

      <TabView>
        <TabPanel header="Subscriptions">
          <DataTable value={filteredSubs} paginator rows={10} rowsPerPageOptions={[10,20,50]} responsiveLayout="scroll">
            <Column field="company_name" header="Company" sortable></Column>
            <Column header="Plan" body={planCycleTemplate}></Column>
            <Column header="Plan Type" body={planTypeTemplate}></Column>
            <Column header="Status" body={statusTemplateSub}></Column>
            <Column field="start_date" header="Start"></Column>
            <Column field="end_date" header="End"></Column>
          </DataTable>
        </TabPanel>
    <TabPanel header="Payments">
          {!hasPerm('billing:view') && (<div style={{ color: 'crimson' }}>You do not have permission to view payments.</div>)}
          {hasPerm('billing:view') && (
          <DataTable value={filteredPays} paginator rows={10} rowsPerPageOptions={[10,20,50]} responsiveLayout="scroll">
            <Column field="company_name" header="Company" sortable></Column>
            <Column header="Plan" body={planCycleTemplate}></Column>
            <Column header="Plan Type" body={planTypeTemplate}></Column>
            <Column header="Status" body={statusTemplatePay}></Column>
            <Column field="amount" header="Amount" sortable></Column>
            <Column field="currency" header="Currency"></Column>
      <Column header="Invoice" body={invoiceTemplate}></Column>
            <Column field="payment_date" header="Payment Date"></Column>
          </DataTable>)}
        </TabPanel>
      </TabView>

      <Dialog
        header={`Invoice Preview`}
        visible={invoiceVisible}
        style={{ width: '720px', maxWidth: '95vw' }}
        modal
        onHide={()=>{ setInvoiceVisible(false); setInvoiceData(null); }}
      >
        <InvoicePreview row={invoiceData} />
      </Dialog>
    </div>
  );
}
