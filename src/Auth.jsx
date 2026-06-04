import { useState } from "react";
import { supabase } from "./supabase";

export default function Auth() {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [mode,     setMode]     = useState("login");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handle = async () => {
    if (!email || !password) { setError("أدخل الإيميل وكلمة السر"); return; }
    setLoading(true); setError("");
    try {
      if (mode === "login") {
        const { error: e } = await supabase.auth.signInWithPassword({ email, password });
        if (e) setError("إيميل أو كلمة سر خاطئة");
      } else {
        const { error: e } = await supabase.auth.signUp({ email, password });
        if (e) setError(e.message);
        else setMode("sent");
      }
    } catch { setError("حدث خطأ، حاول مجدداً"); }
    setLoading(false);
  };

  const inp = {
    width:"100%", padding:"13px 14px", borderRadius:12,
    border:"1.5px solid #e2e8f0", fontSize:16, background:"#f8fafc",
    color:"#1e293b", outline:"none", boxSizing:"border-box",
    direction:"ltr", fontFamily:"inherit", WebkitAppearance:"none",
  };

  if (mode === "sent") return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#e0f2fe,#f0fdf4)", padding:20 }}>
      <div style={{ background:"white", borderRadius:20, padding:"40px 28px", textAlign:"center", maxWidth:360, width:"100%", boxShadow:"0 8px 40px #0369a120" }}>
        <div style={{ fontSize:56, marginBottom:16 }}>📧</div>
        <div style={{ fontSize:18, fontWeight:700, color:"#0369a1", marginBottom:8 }}>تحقق من إيميلك!</div>
        <div style={{ fontSize:14, color:"#64748b", lineHeight:1.6 }}>أرسلنا رابط تأكيد إلى<br/><strong>{email}</strong></div>
        <button onClick={()=>setMode("login")} style={{ marginTop:24, width:"100%", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:12, padding:"12px", fontFamily:"inherit", fontWeight:600, fontSize:15, cursor:"pointer" }}>
          رجوع لتسجيل الدخول
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100dvh", display:"flex", alignItems:"center", justifyContent:"center", background:"linear-gradient(160deg,#e0f2fe,#f0fdf4)", padding:20, direction:"rtl" }}>
      <div style={{ background:"white", borderRadius:20, padding:"32px 24px", maxWidth:380, width:"100%", boxShadow:"0 8px 40px #0369a120" }}>
        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ width:60, height:60, background:"linear-gradient(135deg,#075985,#0ea5e9)", borderRadius:16, display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, margin:"0 auto 12px" }}>🏠</div>
          <div style={{ fontSize:20, fontWeight:800, color:"#0369a1" }}>White Home</div>
          <div style={{ fontSize:13, color:"#94a3b8", marginTop:4 }}>إدارة طلبات التنظيف</div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", background:"#f1f5f9", borderRadius:12, padding:4, marginBottom:24 }}>
          {[["login","دخول"],["register","حساب جديد"]].map(([m,l])=>(
            <button key={m} onClick={()=>{ setMode(m); setError(""); }}
              style={{ padding:"9px", border:"none", borderRadius:9, fontFamily:"inherit", fontWeight:700, fontSize:14, cursor:"pointer", transition:"all 0.2s",
                       background: mode===m ? "white" : "transparent",
                       color:       mode===m ? "#0369a1" : "#94a3b8",
                       boxShadow:   mode===m ? "0 2px 8px #0369a120" : "none" }}>
              {l}
            </button>
          ))}
        </div>

        <div style={{ display:"grid", gap:14 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>الإيميل</label>
            <input style={inp} type="email" placeholder="example@email.com" value={email} onChange={e=>setEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:"#475569", display:"block", marginBottom:7 }}>كلمة السر</label>
            <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handle()} />
          </div>

          {error && (
            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:10, padding:"10px 12px", fontSize:13, color:"#dc2626", textAlign:"center" }}>
              ⚠️ {error}
            </div>
          )}

          <button onClick={handle} disabled={loading}
            style={{ background: loading ? "#94a3b8" : "linear-gradient(90deg,#075985,#0ea5e9)", color:"white", border:"none", borderRadius:12, padding:"14px", fontFamily:"inherit", fontWeight:700, fontSize:16, cursor: loading ? "not-allowed" : "pointer", marginTop:4 }}>
            {loading ? "جاري..." : mode==="login" ? "🔑 دخول" : "✅ إنشاء حساب"}
          </button>
        </div>

        <div style={{ textAlign:"center", marginTop:20, fontSize:12, color:"#94a3b8", lineHeight:1.7 }}>
          🔒 كل من يدخل بنفس الإيميل<br/>يرى نفس الطلبات
        </div>
      </div>
    </div>
  );
}
