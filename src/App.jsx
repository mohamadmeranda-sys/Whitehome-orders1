import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

const STORAGE_KEY = "white_home_orders";
const STATUS_MAP  = { pending:"بانتظار", confirmed:"مؤكد", done:"منجز", cancelled:"ملغي" };
const STATUS_OPTS = [
  { value:"pending",   label:"بانتظار", color:"#f59e0b", bg:"#fef3c7" },
  { value:"confirmed", label:"مؤكد",    color:"#2563eb", bg:"#dbeafe" },
  { value:"done",      label:"منجز",    color:"#16a34a", bg:"#dcfce7" },
  { value:"cancelled", label:"ملغي",    color:"#dc2626", bg:"#fee2e2" },
];

const emptyForm = () => ({
  clientName:"", apartmentNumber:"", hours:"", agreedAmount:"",
  date: new Date().toISOString().split("T")[0], notes:""
});

const fmtMoney = v => v ? `${Number(v).toLocaleString("ar-AE")} د.إ` : "—";
const fmtDate  = d => d ? new Date(d).toLocaleDateString("ar-AE",{year:"numeric",month:"short",day:"numeric"}) : "—";

// ── Icon SVGs ─────────────────────────────────────────────────────
const IconHome    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const IconPlus    = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const IconBack    = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>;
const IconExcel   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 7V3.5L18.5 9H13zm-2 9l-2-3-2 3H5l3.5-5L5 8h2l2 3 2-3h2l-3.5 5 3.5 5h-2z"/></svg>;
const IconEdit    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const IconTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const IconSearch  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;

// ── Status Badge ──────────────────────────────────────────────────
function StatusBadge({ status, onChange }) {
  const cur = STATUS_OPTS.find(o=>o.value===status)||STATUS_OPTS[0];
  return (
    <select value={status} onChange={e=>onChange(e.target.value)}
      style={{ background:cur.bg, color:cur.color, border:`1.5px solid ${cur.color}50`,
               borderRadius:20, padding:"4px 10px", fontSize:12, fontFamily:"inherit",
               fontWeight:700, cursor:"pointer", outline:"none" }}>
      {STATUS_OPTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [orders,     setOrders]     = useState([]);
  const [form,       setForm]       = useState(emptyForm());
  const [view,       setView]       = useState("list");   // list | form | detail
  const [editId,     setEditId]     = useState(null);
  const [detailId,   setDetailId]   = useState(null);
  const [search,     setSearch]     = useState("");
  const [submitted,  setSubmitted]  = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);
  const [exportDone, setExportDone] = useState(false);

  useEffect(()=>{
    try { const s=localStorage.getItem(STORAGE_KEY); if(s) setOrders(JSON.parse(s)); } catch {}
  },[]);

  const persist = list => { setOrders(list); try { localStorage.setItem(STORAGE_KEY,JSON.stringify(list)); } catch {} };

  const goList = () => { setView("list"); setEditId(null); setDetailId(null); setForm(emptyForm()); };

  const handleSubmit = () => {
    if (!form.clientName||!form.apartmentNumber||!form.agreedAmount||!form.date) return;
    persist(editId
      ? orders.map(o=>o.id===editId?{...o,...form}:o)
      : [{...form, id:Date.now(), status:"pending"}, ...orders]
    );
    setSubmitted(true);
    setTimeout(()=>{ setSubmitted(false); goList(); }, 1400);
  };

  const handleEdit   = o => { setForm({clientName:o.clientName,apartmentNumber:o.apartmentNumber,hours:o.hours,agreedAmount:o.agreedAmount,date:o.date,notes:o.notes||""}); setEditId(o.id); setView("form"); };
  const handleDelete = id => { persist(orders.filter(o=>o.id!==id)); setDelConfirm(null); goList(); };
  const handleStatus = (id,s) => persist(orders.map(o=>o.id===id?{...o,status:s}:o));

  const exportExcel = () => {
    if (!orders.length) return;
    const wb = XLSX.utils.book_new();
    const hdr = ["اسم الزبون","رقم الشقة","تاريخ الخدمة","ساعات الشغل","المبلغ (د.إ)","الحالة","ملاحظات"];
    const rows = orders.map(o=>[o.clientName,o.apartmentNumber,o.date,Number(o.hours)||0,Number(o.agreedAmount)||0,STATUS_MAP[o.status]||"بانتظار",o.notes||""]);
    const ws = XLSX.utils.aoa_to_sheet([hdr,...rows]);
    ws["!cols"]=[{wch:22},{wch:14},{wch:16},{wch:12},{wch:18},{wch:12},{wch:28}];
    const totAmt = orders.reduce((s,o)=>s+(Number(o.agreedAmount)||0),0);
    const totHrs = orders.reduce((s,o)=>s+(Number(o.hours)||0),0);
    const ws2 = XLSX.utils.aoa_to_sheet([
      ["ملخص White Home"],["تاريخ التصدير",new Date().toLocaleDateString("ar-AE")],[],
      ["إجمالي الطلبات",orders.length],["المنجزة",orders.filter(o=>o.status==="done").length],
      ["بانتظار",orders.filter(o=>o.status==="pending").length],
      ["إجمالي الساعات",totHrs],["إجمالي المبالغ (د.إ)",totAmt],
    ]);
    ws2["!cols"]=[{wch:24},{wch:18}];
    XLSX.utils.book_append_sheet(wb,ws,"الطلبات");
    XLSX.utils.book_append_sheet(wb,ws2,"الملخص");
    XLSX.writeFile(wb,`WhiteHome_${new Date().toISOString().split("T")[0]}.xlsx`);
    setExportDone(true); setTimeout(()=>setExportDone(false),2500);
  };

  const filtered    = orders.filter(o=>o.clientName.toLowerCase().includes(search.toLowerCase())||o.apartmentNumber.includes(search));
  const totalAmount = orders.reduce((s,o)=>s+(Number(o.agreedAmount)||0),0);
  const totalHours  = orders.reduce((s,o)=>s+(Number(o.hours)||0),0);
  const detailOrder = orders.find(o=>o.id===detailId);
  const isDisabled  = !form.clientName||!form.apartmentNumber||!form.agreedAmount||!form.date;

  // ── Shared styles ──
  const inp = {
    width:"100%", padding:"13px 14px", borderRadius:12, border:"1.5px solid #e2e8f0",
    fontSize:16, background:"#f8fafc", color:"#1e293b", outline:"none",
    boxSizing:"border-box", direction:"rtl", WebkitAppearance:"none"
  };
  const card = { background:"white", borderRadius:16, padding:"16px", boxShadow:"0 2px 16px #0369a112", marginBottom:12 };

  // ═══════════════════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100dvh", background:"linear-gradient(160deg,#e0f2fe 0%,#f0fdf4 100%)", direction:"rtl" }}>

      {/* ── TOP HEADER ── */}
      <div style={{ background:"linear-gradient(90deg,#075985,#0ea5e9)", padding:"14px 16px 14px", paddingTop:"calc(14px + env(safe-area-inset-top))", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100, boxShadow:"0 2px 20px #0369a130" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {view!=="list" && (
            <button onClick={goList} style={{ background:"rgba(255,255,255,0.15)", border:"none", borderRadius:10, padding:"8px", cursor:"pointer", color:"white", display:"flex", alignItems:"center" }}>
              <IconBack/>
            </button>
          )}
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:36, height:36, background:"white", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"#0369a1" }}>
              <IconHome/>
            </div>
            <div>
              <div style={{ color:"white", fontSize:17, fontWeight:700, lineHeight:1.2 }}>White Home</div>
              <div style={{ color:"#bae6fd", fontSize:11 }}>
                {view==="list"  ? "إدارة طلبات التنظيف" :
                 view==="form"  ? (editId?"تعديل طلب":"طلب جديد") :
                 "تفاصيل الطلب"}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          {view==="list" && orders.length>0 && (
            <button onClick={exportExcel} style={{ background:exportDone?"#16a34a":"rgba(255,255,255,0.15)", color:"white", border:"1px solid rgba(255,255,255,0.3)", borderRadius:10, padding:"8px 12px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all 0.3s" }}>
              <IconExcel/> {exportDone?"تم!":"Excel"}
            </button>
          )}
          {view==="list" && (
            <button onClick={()=>{setForm(emptyForm());setEditId(null);setView("form");}} style={{ background:"white", color:"#0369a1", border:"none", borderRadius:10, padding:"8px 14px", cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontSize:14, fontWeight:700, fontFamily:"inherit" }}>
              <IconPlus/> جديد
            </button>
          )}
        </div>
      </div>

      {/* ══════════════ LIST VIEW ══════════════ */}
      {view==="list" && (
        <div style={{ padding:"16px 14px", maxWidth:600, margin:"0 auto" }}>

          {/* Stats row */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
            {[
              { label:"الطلبات", value:orders.length,                                  icon:"📋", color:"#0369a1", bg:"#e0f2fe" },
              { label:"الساعات", value:`${totalHours}س`,                               icon:"⏱️", color:"#7c3aed", bg:"#ede9fe" },
              { label:"المبالغ",  value:`${(totalAmount/1000).toFixed(1)}k`,            icon:"💰", color:"#059669", bg:"#d1fae5" },
            ].map(s=>(
              <div key={s.label} style={{ background:s.bg, borderRadius:14, padding:"12px 8px", textAlign:"center" }}>
                <div style={{ fontSize:20, marginBottom:2 }}>{s.icon}</div>
                <div style={{ fontWeight:800, fontSize:17, color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:"#64748b", marginTop:1 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Search */}
          {orders.length>0 && (
            <div style={{ position:"relative", marginBottom:14 }}>
              <div style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }}><IconSearch/></div>
              <input style={{...inp, paddingRight:42, background:"white", border:"1.5px solid #e2e8f0"}}
                placeholder="ابحث باسم الزبون أو رقم الشقة..."
                value={search} onChange={e=>setSearch(e.target.value)} />
            </div>
          )}

          {/* Empty state */}
          {filtered.length===0 && (
            <div style={{ textAlign:"center", padding:"60px 20px", color:"#94a3b8" }}>
              <div style={{ fontSize:56, marginBottom:12 }}>🧹</div>
              <div style={{ fontSize:16, fontWeight:600, marginBottom:6 }}>{search?"لا توجد نتائج":"لا يوجد طلبات بعد"}</div>
              <div style={{ fontSize:13 }}>{!search && "اضغط «+ جديد» لإضافة أول طلب"}</div>
            </div>
          )}

          {/* Order cards */}
          {filtered.map(order=>{
            const sc = STATUS_OPTS.find(o=>o.value===(order.status||"pending"))||STATUS_OPTS[0];
            return (
              <div key={order.id} style={{...card, borderRight:`4px solid ${sc.color}`, cursor:"pointer"}}
                onClick={()=>{ setDetailId(order.id); setView("detail"); }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:700, fontSize:16, color:"#1e293b" }}>{order.clientName}</div>
                    <div style={{ fontSize:13, color:"#64748b", marginTop:2 }}>🏢 شقة {order.apartmentNumber}</div>
                  </div>
                  <div style={{ background:sc.bg, color:sc.color, border:`1px solid ${sc.color}40`, borderRadius:16, padding:"3px 10px", fontSize:12, fontWeight:700 }}>{sc.label}</div>
                </div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  {[
                    { icon:"📅", val:fmtDate(order.date) },
                    { icon:"⏱️", val:order.hours?`${order.hours} ساعة`:"—" },
                    { icon:"💰", val:fmtMoney(order.agreedAmount) },
                  ].map((item,i)=>(
                    <div key={i} style={{ background:"#f8fafc", borderRadius:8, padding:"5px 10px", fontSize:12, color:"#475569", display:"flex", alignItems:"center", gap:4 }}>
                      <span>{item.icon}</span><span style={{ fontWeight:600 }}>{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div style={{ height:20 }} />
        </div>
      )}

      {/* ══════════════ FORM VIEW ══════════════ */}
      {view==="form" && (
        <div style={{ padding:"16px 14px", maxWidth:520, margin:"0 auto" }}>
          <div style={{ background:"white", borderRadius:20, padding:"22px 18px", boxShadow:"0 4px 30px #0369a112" }}>
            {submitted ? (
              <div style={{ textAlign:"center", padding:"48px 0" }}>
                <div style={{ fontSize:60 }}>✅</div>
                <div style={{ fontSize:18, fontWeight:700, color:"#16a34a", marginTop:14 }}>تم الحفظ بنجاح!</div>
              </div>
            ) : (
              <div style={{ display:"grid", gap:18 }}>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>اسم الزبون *</label>
                    <input style={inp} placeholder="محمد علي" value={form.clientName} onChange={e=>setForm(p=>({...p,clientName:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>رقم الشقة *</label>
                    <input style={inp} placeholder="B3-201" value={form.apartmentNumber} onChange={e=>setForm(p=>({...p,apartmentNumber:e.target.value}))} />
                  </div>
                </div>

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>ساعات الشغل</label>
                    <input style={inp} type="number" inputMode="decimal" placeholder="3" min="0.5" step="0.5" value={form.hours} onChange={e=>setForm(p=>({...p,hours:e.target.value}))} />
                  </div>
                  <div>
                    <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>المبلغ (د.إ) *</label>
                    <input style={inp} type="number" inputMode="numeric" placeholder="250" min="0" value={form.agreedAmount} onChange={e=>setForm(p=>({...p,agreedAmount:e.target.value}))} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>تاريخ الخدمة *</label>
                  <input style={inp} type="date" value={form.date} onChange={e=>setForm(p=>({...p,date:e.target.value}))} />
                </div>

                <div>
                  <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>ملاحظات</label>
                  <textarea style={{...inp, resize:"none", height:80}} placeholder="تعليمات خاصة..." value={form.notes} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} />
                </div>

                <button onClick={handleSubmit} disabled={isDisabled}
                  style={{ background:isDisabled?"#cbd5e1":"linear-gradient(90deg,#075985,#0ea5e9)", color:"white", border:"none", borderRadius:14, padding:"15px", fontFamily:"inherit", fontWeight:700, fontSize:17, cursor:isDisabled?"not-allowed":"pointer" }}>
                  {editId ? "💾 حفظ التعديلات" : "✅ حفظ الطلب"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ DETAIL VIEW ══════════════ */}
      {view==="detail" && detailOrder && (()=>{
        const sc = STATUS_OPTS.find(o=>o.value===(detailOrder.status||"pending"))||STATUS_OPTS[0];
        return (
          <div style={{ padding:"16px 14px", maxWidth:520, margin:"0 auto" }}>
            {/* Status banner */}
            <div style={{ background:sc.bg, border:`1.5px solid ${sc.color}30`, borderRadius:14, padding:"12px 16px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontSize:14, fontWeight:700, color:sc.color }}>الحالة الحالية: {sc.label}</div>
              <StatusBadge status={detailOrder.status||"pending"} onChange={v=>handleStatus(detailOrder.id,v)} />
            </div>

            {/* Info card */}
            <div style={card}>
              <div style={{ fontSize:20, fontWeight:800, color:"#1e293b", marginBottom:4 }}>{detailOrder.clientName}</div>
              <div style={{ fontSize:14, color:"#64748b", marginBottom:18 }}>🏢 شقة {detailOrder.apartmentNumber}</div>

              {[
                { label:"تاريخ الخدمة",        val:fmtDate(detailOrder.date),                              icon:"📅" },
                { label:"ساعات الشغل",          val:detailOrder.hours?`${detailOrder.hours} ساعة`:"—",      icon:"⏱️" },
                { label:"المبلغ المتفق عليه",   val:fmtMoney(detailOrder.agreedAmount),                     icon:"💰" },
              ].map(item=>(
                <div key={item.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ fontSize:14, color:"#64748b" }}>{item.icon} {item.label}</div>
                  <div style={{ fontSize:15, fontWeight:700, color:"#1e293b" }}>{item.val}</div>
                </div>
              ))}

              {detailOrder.notes && (
                <div style={{ background:"#fef9c3", borderRadius:10, padding:"10px 12px", marginTop:14, fontSize:13, color:"#78350f" }}>
                  📝 {detailOrder.notes}
                </div>
              )}
            </div>

            {/* Actions */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              <button onClick={()=>handleEdit(detailOrder)}
                style={{ background:"white", color:"#1d4ed8", border:"1.5px solid #bfdbfe", borderRadius:12, padding:"13px", fontFamily:"inherit", fontWeight:700, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                <IconEdit/> تعديل
              </button>
              {delConfirm===detailOrder.id ? (
                <button onClick={()=>handleDelete(detailOrder.id)}
                  style={{ background:"#dc2626", color:"white", border:"none", borderRadius:12, padding:"13px", fontFamily:"inherit", fontWeight:700, fontSize:15, cursor:"pointer" }}>
                  تأكيد الحذف ⚠️
                </button>
              ) : (
                <button onClick={()=>setDelConfirm(detailOrder.id)}
                  style={{ background:"white", color:"#dc2626", border:"1.5px solid #fecaca", borderRadius:12, padding:"13px", fontFamily:"inherit", fontWeight:700, fontSize:15, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  <IconTrash/> حذف
                </button>
              )}
            </div>
            {delConfirm===detailOrder.id && (
              <button onClick={()=>setDelConfirm(null)} style={{ width:"100%", marginTop:8, background:"#f1f5f9", color:"#64748b", border:"none", borderRadius:12, padding:"12px", fontFamily:"inherit", fontSize:14, cursor:"pointer" }}>
                إلغاء
              </button>
            )}
            <div style={{ height:20 }} />
          </div>
        );
      })()}

    </div>
  );
}
