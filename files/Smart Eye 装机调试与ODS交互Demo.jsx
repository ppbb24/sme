import { useState, useEffect, useCallback, useRef } from "react";
import { Camera, Wrench, FileText, Monitor, Share2, ChevronRight, Home, Eye, EyeOff, Plus, RotateCcw, Lock, ArrowLeft, ArrowRight, Check, X, Loader2, Image, Focus, Sun, Palette, Crosshair, Save, RefreshCw, Zap, AlertCircle, CheckCircle2, XCircle, Settings2, Scan, Activity } from "lucide-react";

/* ═══════════════════════════════════════════
   CONSTANTS & TYPES
   ═══════════════════════════════════════════ */
const STATUS = { PENDING: "pending", RUNNING: "running", PASS: "pass", FAIL: "fail" };

const INSTALL_STEPS = [
  { id: "pose", label: "位置与姿态", icon: Crosshair },
  { id: "clarity", label: "清晰度", icon: Focus },
  { id: "brightness", label: "亮度", icon: Sun },
  { id: "chroma", label: "色度", icon: Palette },
];

const ODS_STEPS = [
  { id: "fov", label: "成像视野确定", icon: Scan },
  { id: "clarity", label: "清晰度调整", icon: Focus },
  { id: "brightness", label: "亮度", icon: Sun },
  { id: "wb", label: "相机白平衡调整", icon: Palette },
];

/* ═══════════════════════════════════════════
   SHARED UI COMPONENTS
   ═══════════════════════════════════════════ */
const SliderControl = ({ label, value, onChange, min = 0, max = 100, step = 1, disabled, refValue, isFail }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
    <span style={{ color: "#ccc", fontSize: 12, minWidth: 68, flexShrink: 0 }}>{label}</span>
    <div style={{ flex: 1, position: "relative", height: 20, display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", width: "100%", height: 3, background: "#333", borderRadius: 2 }} />
      <div style={{ position: "absolute", width: `${((value - min) / (max - min)) * 100}%`, height: 3, background: disabled ? "#555" : isFail ? "#ef5350" : "#8bc34a", borderRadius: 2 }} />
      {refValue !== undefined && (
        <div style={{ position: "absolute", left: `${((refValue - min) / (max - min)) * 100}%`, top: -2, width: 2, height: 24, background: "#4caf50", opacity: 0.6, borderRadius: 1 }} title={`标准值: ${refValue}`} />
      )}
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} disabled={disabled}
        style={{ position: "relative", width: "100%", height: 20, appearance: "none", background: "transparent", cursor: disabled ? "not-allowed" : "pointer", zIndex: 1 }} />
    </div>
    <input type="number" value={value} min={min} max={max} step={step} onChange={e => onChange(parseFloat(e.target.value) || min)} disabled={disabled}
      style={{ width: 50, height: 26, background: "#1e1e1e", border: `1px solid ${isFail ? "#ef5350" : "#444"}`, borderRadius: 3, color: "#ddd", fontSize: 12, textAlign: "center", flexShrink: 0 }} />
    {isFail && <AlertCircle size={14} color="#ef5350" style={{ flexShrink: 0 }} />}
  </div>
);

const RadioGroup = ({ options, value, onChange, disabled }) => (
  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
    {options.map(opt => (
      <label key={opt.value} onClick={() => !disabled && onChange(opt.value)} style={{ display: "flex", alignItems: "center", gap: 4, cursor: disabled ? "not-allowed" : "pointer", color: "#ccc", fontSize: 12 }}>
        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${value === opt.value ? "#8bc34a" : "#555"}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {value === opt.value && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8bc34a" }} />}
        </div>
        {opt.label}
      </label>
    ))}
  </div>
);

const ActionBtn = ({ children, onClick, disabled, loading, variant = "primary" }) => {
  const bg = variant === "primary" ? (disabled ? "#4a5a3a" : "linear-gradient(135deg, #8bc34a, #689f38)") : "transparent";
  const border = variant === "ghost" ? "1px solid #555" : "none";
  const color = variant === "ghost" ? "#aaa" : "#fff";
  return (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", height: 36, background: bg, border, borderRadius: 5, color, fontSize: 13, fontWeight: 500, cursor: disabled ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: disabled ? 0.6 : 1, transition: "all 0.2s" }}>
      {loading && <Loader2 size={14} className="spin" />}
      {children}
    </button>
  );
};

const SectionTitle = ({ children }) => <div style={{ color: "#eee", fontSize: 13, fontWeight: 600, margin: "14px 0 8px" }}>{children}</div>;

const StatusBadge = ({ status, large }) => {
  if (status === STATUS.PASS) return <span style={{ color: "#8bc34a", fontSize: large ? 18 : 13, fontWeight: 700 }}>PASS</span>;
  if (status === STATUS.FAIL) return <span style={{ color: "#ef5350", fontSize: large ? 18 : 13, fontWeight: 700 }}>FAIL</span>;
  return null;
};

const CompareRow = ({ label, std, cur, diff, threshold, status }) => {
  const isFail = status === "FAIL";
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: 12, padding: "6px 8px", background: isFail ? "rgba(239,83,80,0.08)" : "transparent", borderRadius: 4, marginBottom: 2, borderLeft: isFail ? "3px solid #ef5350" : "3px solid transparent" }}>
      <span style={{ flex: 2, color: "#ccc", fontWeight: 500 }}>{label}</span>
      <span style={{ flex: 1, textAlign: "center", color: "#888" }}>{std}</span>
      <span style={{ flex: 1, textAlign: "center", color: "#ddd" }}>{cur}</span>
      <span style={{ flex: 1, textAlign: "center", color: isFail ? "#ef5350" : "#888", fontWeight: isFail ? 600 : 400 }}>{diff}</span>
      <span style={{ flex: 1, textAlign: "center", color: "#666" }}>{threshold}</span>
      <span style={{ width: 48, textAlign: "center", color: isFail ? "#ef5350" : "#8bc34a", fontWeight: 600 }}>{status}</span>
    </div>
  );
};

const CompareHeader = () => (
  <div style={{ display: "flex", alignItems: "center", fontSize: 11, padding: "4px 8px", color: "#666", borderBottom: "1px solid #333", marginBottom: 4 }}>
    <span style={{ flex: 2 }}>指标</span><span style={{ flex: 1, textAlign: "center" }}>标准值</span><span style={{ flex: 1, textAlign: "center" }}>当前值</span>
    <span style={{ flex: 1, textAlign: "center" }}>偏差</span><span style={{ flex: 1, textAlign: "center" }}>阈值</span><span style={{ width: 48, textAlign: "center" }}>状态</span>
  </div>
);

/* ═══════════════════════════════════════════
   WORKPIECE SVG
   ═══════════════════════════════════════════ */
const WorkpieceSVG = ({ step, mode, brightness = 1 }) => (
  <svg viewBox="0 0 500 600" style={{ width: "52%", maxHeight: "80%", filter: `brightness(${brightness}) drop-shadow(0 4px 20px rgba(0,0,0,0.4))` }}>
    <defs>
      <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d0d0d0" /><stop offset="30%" stopColor="#b8b8b8" /><stop offset="60%" stopColor="#c8c8c8" /><stop offset="100%" stopColor="#a0a0a0" />
      </linearGradient>
    </defs>
    <path d="M175 80 L325 80 L325 200 L420 200 L420 340 L325 340 L325 480 L175 480 L175 340 L80 340 L80 200 L175 200 Z" fill="url(#mg)" stroke="#888" strokeWidth="1" />
    <circle cx="250" cy="270" r="55" fill="#1a1a1a" stroke="#666" strokeWidth="1.5" />
    {[[250,120],[140,270],[360,270],[250,420]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="22" fill="#1a1a1a" stroke="#555" strokeWidth="1" />)}
    {[[210,105],[290,105],[210,435],[290,435],[120,230],[120,310],[380,230],[380,310]].map(([cx,cy],i) => <circle key={i} cx={cx} cy={cy} r="6" fill="#888" stroke="#666" strokeWidth="0.5" />)}
    <text x="110" y="295" fontSize="18" fill="#666" fontFamily="monospace">∞</text>
    {(step === "pose" || step === "fov") && <>
      <line x1="250" y1="40" x2="250" y2="560" stroke="#4ade80" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
      <line x1="40" y1="270" x2="460" y2="270" stroke="#4ade80" strokeWidth="1" strokeDasharray="6 4" opacity="0.7" />
      <rect x="160" y="180" width="180" height="180" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="10 6" />
    </>}
    {step === "clarity" && <>
      <rect x="215" y="135" width="60" height="50" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="210" y="205" fontSize="10" fill="#4ade80">自动对焦ROI</text>
    </>}
    {(step === "brightness" || step === "chroma" || step === "wb") && <>
      <rect x="155" y="155" width="45" height="40" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="148" y="212" fontSize="9" fill="#4ade80">BROI_1</text>
      <rect x="225" y="145" width="50" height="45" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
      <text x="222" y="208" fontSize="9" fill="#4ade80">FROI_1</text>
      <rect x="220" y="370" width="50" height="45" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
      <text x="218" y="432" fontSize="9" fill="#4ade80">FROI_2</text>
      <rect x="300" y="365" width="50" height="50" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
      <text x="298" y="432" fontSize="9" fill="#4ade80">BROI_2</text>
    </>}
  </svg>
);

const ImageArea = ({ step, showROIValues, roiValues, label }) => (
  <div style={{ position: "relative", flex: 1, background: "#1a1a1a", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-conic-gradient(#2a2a2a 0% 25%, #222 0% 50%)", backgroundSize: "20px 20px", opacity: 0.4 }} />
    {label && <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: label === "标准" ? "rgba(76,175,80,0.15)" : "rgba(33,150,243,0.15)", border: `1px solid ${label === "标准" ? "#4caf5055" : "#2196f355"}`, borderRadius: 4, padding: "2px 12px", fontSize: 11, color: label === "标准" ? "#81c784" : "#64b5f6", display: "flex", alignItems: "center", gap: 4, zIndex: 2 }}>
      {label === "标准" && <Lock size={10} />}{label}
    </div>}
    <WorkpieceSVG step={step} />
    {showROIValues && roiValues && (
      <div style={{ position: "absolute", top: 10, left: 10, color: "#4ade80", fontSize: 12, fontFamily: "monospace", lineHeight: 1.7, textShadow: "0 1px 4px rgba(0,0,0,0.8)", zIndex: 2 }}>
        <div>ROI_1 : {roiValues.roi1}</div><div>ROI_2 : {roiValues.roi2}</div><div>差异值 : {roiValues.diff}</div>
      </div>
    )}
    <button style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, background: "rgba(50,50,50,0.7)", border: "1px solid #555", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#aaa", zIndex: 2 }}>
      <Save size={13} />
    </button>
  </div>
);

/* ═══════════════════════════════════════════
   ROI LIST
   ═══════════════════════════════════════════ */
const ROIList = ({ isReadOnly }) => {
  const [pairs, setPairs] = useState([{ name: "ROI_1", visible: true }, { name: "ROI_2", visible: true }]);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ color: "#eee", fontSize: 13, fontWeight: 600 }}>ROI 对</span>
        {!isReadOnly && <button style={{ width: 22, height: 22, background: "transparent", border: "1px solid #555", borderRadius: 3, color: "#aaa", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>}
      </div>
      {pairs.map((p, i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#1e1e1e", borderRadius: 4, marginBottom: 3 }}>
          <span style={{ color: "#ccc", fontSize: 12 }}>{p.name}</span>
          <button onClick={() => { const n = [...pairs]; n[i].visible = !n[i].visible; setPairs(n); }} style={{ background: "none", border: "none", cursor: "pointer", color: p.visible ? "#8bc34a" : "#555" }}>
            {p.visible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        </div>
      ))}
      {isReadOnly && <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>当前使用亮度步骤中的ROI对 · <span style={{ color: "#8bc34a", cursor: "pointer" }}>前往调整ROI</span></div>}
    </div>
  );
};

/* ═══════════════════════════════════════════
   TOP NAV BAR
   ═══════════════════════════════════════════ */
const TopBar = ({ onHome }) => (
  <div style={{ height: 44, background: "#252525", borderBottom: "1px solid #333", display: "flex", alignItems: "center", paddingLeft: 14, gap: 20, flexShrink: 0 }}>
    <div onClick={onHome} style={{ cursor: "pointer", background: "linear-gradient(135deg, #8bc34a, #689f38)", borderRadius: 5, padding: "3px 12px", display: "flex", alignItems: "center" }}>
      <span style={{ color: "#fff", fontSize: 14, fontWeight: 700, letterSpacing: 1 }}>Smart Eye</span>
    </div>
    <div style={{ display: "flex", gap: 18, fontSize: 12, color: "#888" }}>
      <span style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}><Camera size={14} /> 相机管理</span>
      <span onClick={onHome} style={{ display: "flex", alignItems: "center", gap: 4, color: "#eee", cursor: "pointer" }}><Wrench size={14} /> 工作台</span>
      <span style={{ display: "flex", alignItems: "center", gap: 4, cursor: "pointer", color: "#8bc34a" }}><FileText size={14} /> 点位配方管理</span>
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: "flex", gap: 10, paddingRight: 14, color: "#777" }}>
      <Activity size={15} style={{ cursor: "pointer" }} /><Monitor size={15} style={{ cursor: "pointer" }} /><Share2 size={15} style={{ cursor: "pointer" }} />
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   STEP TAB BAR
   ═══════════════════════════════════════════ */
const StepTabs = ({ steps, current, statuses, onSelect, disabled, rightAction }) => (
  <div style={{ height: 40, background: "#2a2a2a", borderBottom: "1px solid #333", display: "flex", alignItems: "center", paddingLeft: 14, flexShrink: 0 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 4, marginRight: 16, fontSize: 12, color: "#777" }}>
      <Home size={13} /> <span>装机调试</span>
    </div>
    <div style={{ display: "flex", flex: 1, height: "100%" }}>
      {steps.map((s, i) => {
        const isActive = current === i;
        const st = statuses[i];
        const Icon = s.icon;
        return (
          <button key={s.id} onClick={() => !disabled && onSelect(i)} disabled={disabled}
            style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, height: "100%", padding: "0 20px", background: isActive ? "#333" : "transparent", border: "none", borderBottom: isActive ? "2px solid #8bc34a" : "2px solid transparent", color: isActive ? "#eee" : "#777", fontSize: 12, fontWeight: isActive ? 600 : 400, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
            {st === STATUS.PASS && <CheckCircle2 size={13} color="#8bc34a" />}
            {st === STATUS.FAIL && <XCircle size={13} color="#ef5350" />}
            {st !== STATUS.PASS && st !== STATUS.FAIL && <Icon size={13} />}
            {s.label}
          </button>
        );
      })}
    </div>
    {rightAction}
  </div>
);

/* ═══════════════════════════════════════════
   TOAST
   ═══════════════════════════════════════════ */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 2800); return () => clearTimeout(t); }, [onClose]);
  const bg = type === "success" ? "#2e7d32" : type === "error" ? "#c62828" : "#1565c0";
  return <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 300, padding: "8px 20px", borderRadius: 6, background: bg, color: "#fff", fontSize: 13, fontWeight: 500, boxShadow: "0 4px 20px rgba(0,0,0,0.4)", animation: "slideDown .3s ease" }}>{message}</div>;
};

/* ═══════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════ */
const Modal = ({ children, onClose }) => (
  <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }} onClick={onClose} />
    <div style={{ position: "relative", width: 420, background: "#2a2a2a", borderRadius: 10, border: "1px solid #444", padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>{children}</div>
  </div>
);

/* ═══════════════════════════════════════════
   SAVE MODAL (装机调试)
   ═══════════════════════════════════════════ */
const SaveModal = ({ statuses, steps, onClose, onSave }) => {
  const [mode, setMode] = useState("overwrite");
  const [name, setName] = useState("");
  return (
    <Modal onClose={onClose}>
      <h3 style={{ color: "#eee", fontSize: 16, fontWeight: 600, marginBottom: 16 }}>调试结果总览</h3>
      <div style={{ marginBottom: 20 }}>
        {steps.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "#333", borderRadius: 5, marginBottom: 4 }}>
            <span style={{ color: "#ccc", fontSize: 13 }}>{s.label}</span>
            {statuses[i] === STATUS.PASS ? <span style={{ color: "#8bc34a", fontWeight: 600, fontSize: 13 }}>✓ 通过</span> : <span style={{ color: "#ef5350", fontWeight: 600, fontSize: 13 }}>✗ 未通过</span>}
          </div>
        ))}
      </div>
      <h4 style={{ color: "#eee", fontSize: 14, fontWeight: 600, marginBottom: 10 }}>保存方式</h4>
      {[["overwrite", "覆盖原配方 (config1)"], ["new", "另存为新配方"]].map(([v, l]) => (
        <label key={v} onClick={() => setMode(v)} style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer", marginBottom: 8, color: "#ccc", fontSize: 12 }}>
          <div style={{ width: 14, height: 14, borderRadius: "50%", border: `2px solid ${mode === v ? "#8bc34a" : "#555"}`, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1, flexShrink: 0 }}>
            {mode === v && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8bc34a" }} />}
          </div>
          <div style={{ flex: 1 }}>
            {l}
            {v === "new" && mode === "new" && <input type="text" value={name} onChange={e => setName(e.target.value)} onClick={e => e.stopPropagation()} placeholder="输入配方名称" style={{ display: "block", marginTop: 6, width: "100%", height: 30, background: "#1e1e1e", border: "1px solid #555", borderRadius: 4, color: "#ddd", fontSize: 12, padding: "0 8px", boxSizing: "border-box" }} />}
          </div>
        </label>
      ))}
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 18 }}>
        <button onClick={onClose} style={{ height: 34, padding: "0 18px", background: "transparent", border: "1px solid #555", borderRadius: 5, color: "#aaa", fontSize: 12, cursor: "pointer" }}>取消</button>
        <button onClick={() => onSave(mode, name)} style={{ height: 34, padding: "0 18px", background: "linear-gradient(135deg,#8bc34a,#689f38)", border: "none", borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>确认保存</button>
      </div>
    </Modal>
  );
};

/* ═══════════════════════════════════════════
   INSTALL DEBUGGING (装机调试) PANELS
   ═══════════════════════════════════════════ */
const InstallPosePanel = ({ p, set, status, onAuto }) => {
  const r = status === STATUS.RUNNING;
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>位置与姿态</span><StatusBadge status={status} large /></div>
    <SectionTitle>智能对位</SectionTitle>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "对位中..." : "⊕ 自动寻找中心并锁定"}</ActionBtn>
    <p style={{ color: "#666", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>如自动对位效果不佳，请使用下方手动控制进行微调</p>
    <SectionTitle>光源亮度</SectionTitle>
    {["light1","light2","light3"].map((k,i) => <SliderControl key={k} label={`光源${i+1}`} value={p[k]} onChange={v=>set({...p,[k]:v})} disabled={r} />)}
    <SectionTitle>成像参数</SectionTitle>
    <SliderControl label="曝光" value={p.exposure} onChange={v=>set({...p,exposure:v})} disabled={r} />
    <SliderControl label="增益" value={p.gain} onChange={v=>set({...p,gain:v})} min={0} max={10} step={0.01} disabled={r} />
    <SliderControl label="Gamma" value={p.gamma} onChange={v=>set({...p,gamma:v})} min={0} max={3} step={0.1} disabled={r} />
    <SectionTitle>视野中心</SectionTitle>
    <SliderControl label="最大允许误差 X" value={p.errX} onChange={v=>set({...p,errX:v})} disabled={r} />
    <SliderControl label="最大允许误差 Y" value={p.errY} onChange={v=>set({...p,errY:v})} min={0} max={10} step={0.01} disabled={r} />
    <SliderControl label="图像中心" value={p.imgC} onChange={v=>set({...p,imgC:v})} min={0} max={3} step={0.1} disabled={r} />
    <SliderControl label="视野ROI中心" value={p.roiC} onChange={v=>set({...p,roiC:v})} min={0} max={3} step={0.1} disabled={r} />
  </div>);
};

const InstallClarityPanel = ({ p, set, status, onAuto }) => {
  const r = status === STATUS.RUNNING;
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>清晰度</span><StatusBadge status={status} large /></div>
    <SectionTitle>智能清晰度</SectionTitle>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "对焦中..." : "⊕ 自动对焦"}</ActionBtn>
    <p style={{ color: "#666", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>如自动对位效果不佳，请使用下方手动控制进行微调</p>
    <SliderControl label="清晰度" value={p.clarity} onChange={v=>set({...p,clarity:v})} disabled={r} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ color: "#ccc", fontSize: 12, minWidth: 68 }}>对焦模式</span>
      <RadioGroup options={[{value:"auto",label:"自动对焦"},{value:"manual",label:"手动对焦"}]} value={p.mode} onChange={v=>set({...p,mode:v})} disabled={r} />
    </div>
    <SliderControl label="对焦精度" value={p.precision} onChange={v=>set({...p,precision:v})} disabled={r} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ color: "#ccc", fontSize: 12, minWidth: 68 }}>对焦速度</span>
      <RadioGroup options={[{value:"low",label:"低"},{value:"mid",label:"中"},{value:"high",label:"高"}]} value={p.speed} onChange={v=>set({...p,speed:v})} disabled={r} />
    </div>
  </div>);
};

const InstallBrightnessPanel = ({ p, set, status, onAuto, roi }) => {
  const r = status === STATUS.RUNNING;
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>亮度</span><StatusBadge status={status} large /></div>
    <SectionTitle>智能调节亮度</SectionTitle>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "优化中..." : "◐ 自动亮度优化"}</ActionBtn>
    <p style={{ color: "#666", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>如自动亮度优化的效果不佳，请使用下方手动控制进行微调</p>
    <SliderControl label="亮度" value={p.brightness} onChange={v=>set({...p,brightness:v})} disabled={r} />
    <SectionTitle>成像参数</SectionTitle>
    <SliderControl label="曝光" value={p.exposure} onChange={v=>set({...p,exposure:v})} disabled={r} />
    <SliderControl label="增益" value={p.gain} onChange={v=>set({...p,gain:v})} min={0} max={10} step={0.01} disabled={r} />
    <SliderControl label="Gamma" value={p.gamma} onChange={v=>set({...p,gamma:v})} min={0} max={3} step={0.1} disabled={r} />
    <ROIList />
  </div>);
};

const InstallChromaPanel = ({ p, set, status, onAuto }) => {
  const r = status === STATUS.RUNNING;
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>色度</span><StatusBadge status={status} large /></div>
    <SectionTitle>智能调节色度</SectionTitle>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "优化中..." : "🔗 自动色度优化"}</ActionBtn>
    <p style={{ color: "#666", fontSize: 11, marginTop: 6, lineHeight: 1.5 }}>如自动色度优化的效果不佳，请使用下方手动控制进行微调</p>
    <SliderControl label="亮度" value={p.brightness} onChange={v=>set({...p,brightness:v})} disabled={r} />
    <SectionTitle>相机白平衡比率值</SectionTitle>
    <SliderControl label="R通道" value={p.r} onChange={v=>set({...p,r:v})} max={2000} disabled={r} />
    <SliderControl label="G通道" value={p.g} onChange={v=>set({...p,g:v})} max={2000} disabled={r} />
    <SliderControl label="B通道" value={p.b} onChange={v=>set({...p,b:v})} max={2000} disabled={r} />
    <ROIList isReadOnly />
  </div>);
};

/* ═══════════════════════════════════════════
   ODS PANELS
   ═══════════════════════════════════════════ */
const ODSFovPanel = ({ p, set, status, onAuto, failItems }) => {
  const r = status === STATUS.RUNNING;
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>成像视野确定</span><StatusBadge status={status} large /></div>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "检测中..." : "⊕ 自动对位"}</ActionBtn>
    {(status === STATUS.PASS || status === STATUS.FAIL) && <div style={{ marginTop: 12 }}>
      <CompareHeader />
      <CompareRow label="靶标偏移 X" std="0 px" cur="+8 px" diff="+8" threshold="±10" status={failItems?.includes("x") ? "FAIL" : "PASS"} />
      <CompareRow label="靶标偏移 Y" std="0 px" cur={failItems?.includes("y") ? "+18 px" : "+3 px"} diff={failItems?.includes("y") ? "+18" : "+3"} threshold="±10" status={failItems?.includes("y") ? "FAIL" : "PASS"} />
    </div>}
    <SectionTitle>光源亮度</SectionTitle>
    {["l1","l2","l3"].map((k,i) => <SliderControl key={k} label={`光源${i+1}`} value={p[k]} onChange={v=>set({...p,[k]:v})} disabled={r} refValue={42} />)}
    <SectionTitle>成像参数</SectionTitle>
    <SliderControl label="曝光" value={p.exp} onChange={v=>set({...p,exp:v})} disabled={r} refValue={75} />
    <SliderControl label="增益" value={p.gain} onChange={v=>set({...p,gain:v})} min={0} max={10} step={0.01} disabled={r} refValue={2.0} />
    <SliderControl label="Gamma" value={p.gamma} onChange={v=>set({...p,gamma:v})} min={0} max={3} step={0.1} disabled={r} refValue={0.7} />
  </div>);
};

const ODSClarityPanel = ({ p, set, status, onAuto, failItems }) => {
  const r = status === STATUS.RUNNING;
  const isCFail = failItems?.includes("clarity");
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>清晰度调整</span><StatusBadge status={status} large /></div>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "对焦中..." : "⊕ 自动对焦"}</ActionBtn>
    {(status === STATUS.PASS || status === STATUS.FAIL) && <div style={{ marginTop: 12 }}>
      <CompareHeader />
      <CompareRow label="清晰度评分" std="85" cur={isCFail ? "72" : "83"} diff={isCFail ? "-13" : "-2"} threshold="±5" status={isCFail ? "FAIL" : "PASS"} />
    </div>}
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 10px" }}>
      <span style={{ color: "#ccc", fontSize: 12, minWidth: 68 }}>对焦模式</span>
      <RadioGroup options={[{value:"auto",label:"自动对焦"},{value:"manual",label:"手动对焦"}]} value={p.mode} onChange={v=>set({...p,mode:v})} disabled={r} />
    </div>
    <SliderControl label="清晰度阈值" value={p.threshold} onChange={v=>set({...p,threshold:v})} disabled={r} refValue={80} />
    <SliderControl label="对焦精度" value={p.precision} onChange={v=>set({...p,precision:v})} disabled={r} refValue={80} isFail={isCFail} />
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ color: "#ccc", fontSize: 12, minWidth: 68 }}>对焦速度</span>
      <RadioGroup options={[{value:"low",label:"低"},{value:"mid",label:"中"},{value:"high",label:"高"}]} value={p.speed} onChange={v=>set({...p,speed:v})} disabled={r} />
    </div>
  </div>);
};

const ODSBrightnessPanel = ({ p, set, status, onAuto, failItems }) => {
  const r = status === STATUS.RUNNING;
  const bFail = failItems?.includes("fBright");
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>亮度</span><StatusBadge status={status} large /></div>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "优化中..." : "◐ 自动亮度优化"}</ActionBtn>
    {(status === STATUS.PASS || status === STATUS.FAIL) && <div style={{ marginTop: 12 }}>
      <CompareHeader />
      <CompareRow label="前景亮度" std="165.2" cur={bFail ? "142.0" : "162.0"} diff={bFail ? "-23.2" : "-3.2"} threshold="±15" status={bFail ? "FAIL" : "PASS"} />
      <CompareRow label="背景亮度" std="72.8" cur="68.5" diff="-4.3" threshold="±15" status="PASS" />
      <CompareRow label="差异值" std="92.4" cur={bFail ? "73.5" : "93.5"} diff={bFail ? "-18.9" : "+1.1"} threshold="±15" status={bFail ? "FAIL" : "PASS"} />
    </div>}
    <SectionTitle>参数调整</SectionTitle>
    <SliderControl label="亮度" value={p.brightness} onChange={v=>set({...p,brightness:v})} disabled={r} refValue={60} isFail={bFail} />
    <SliderControl label="曝光" value={p.exp} onChange={v=>set({...p,exp:v})} disabled={r} refValue={75} isFail={bFail} />
    <SliderControl label="增益" value={p.gain} onChange={v=>set({...p,gain:v})} min={0} max={10} step={0.01} disabled={r} refValue={2.0} />
    <SliderControl label="Gamma" value={p.gamma} onChange={v=>set({...p,gamma:v})} min={0} max={3} step={0.1} disabled={r} refValue={0.7} />
    <ROIList />
  </div>);
};

const ODSWBPanel = ({ p, set, status, onAuto, failItems }) => {
  const r = status === STATUS.RUNNING;
  const gFail = failItems?.includes("gray");
  const wbFail = failItems?.includes("wb");
  return (<div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}><span style={{ color: "#eee", fontSize: 15, fontWeight: 600 }}>相机白平衡调整</span><StatusBadge status={status} large /></div>
    <ActionBtn onClick={onAuto} disabled={r} loading={r}>{r ? "校验中..." : "⊕ 自动白平衡"}</ActionBtn>
    {(status === STATUS.PASS || status === STATUS.FAIL) && <>
      <div style={{ marginTop: 14, padding: "6px 8px", background: gFail ? "rgba(239,83,80,0.06)" : "rgba(139,195,74,0.06)", borderRadius: 5, border: `1px solid ${gFail ? "#ef535033" : "#8bc34a33"}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 6 }}>灰度一致性校验 <StatusBadge status={gFail ? STATUS.FAIL : STATUS.PASS} /></div>
        <CompareHeader />
        <CompareRow label="ROI_1 灰度" std="128.0" cur="125.5" diff="-2.5" threshold="±5" status="PASS" />
        <CompareRow label="ROI_2 灰度" std="128.0" cur={gFail ? "121.0" : "126.5"} diff={gFail ? "-7.0" : "-1.5"} threshold="±5" status={gFail ? "FAIL" : "PASS"} />
      </div>
      <div style={{ marginTop: 10, padding: "6px 8px", background: wbFail ? "rgba(239,83,80,0.06)" : "rgba(139,195,74,0.06)", borderRadius: 5, border: `1px solid ${wbFail ? "#ef535033" : "#8bc34a33"}` }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 6 }}>白平衡调整 <StatusBadge status={wbFail ? STATUS.FAIL : STATUS.PASS} /></div>
        <CompareHeader />
        <CompareRow label="R通道" std="1020" cur={wbFail ? "980" : "1015"} diff={wbFail ? "-40" : "-5"} threshold="±20" status={wbFail ? "FAIL" : "PASS"} />
        <CompareRow label="G通道" std="580" cur="575" diff="-5" threshold="±20" status="PASS" />
        <CompareRow label="B通道" std="990" cur="985" diff="-5" threshold="±20" status="PASS" />
      </div>
    </>}
    <SectionTitle>白平衡参数</SectionTitle>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
      <span style={{ color: "#ccc", fontSize: 12, minWidth: 68 }}>白平衡模式</span>
      <RadioGroup options={[{value:"auto",label:"自动"},{value:"manual",label:"手动"}]} value={p.wbMode} onChange={v=>set({...p,wbMode:v})} disabled={r} />
    </div>
    <SliderControl label="R通道" value={p.r} onChange={v=>set({...p,r:v})} max={2000} disabled={r} refValue={1020} isFail={wbFail} />
    <SliderControl label="G通道" value={p.g} onChange={v=>set({...p,g:v})} max={2000} disabled={r} refValue={580} />
    <SliderControl label="B通道" value={p.b} onChange={v=>set({...p,b:v})} max={2000} disabled={r} refValue={990} />
    <SliderControl label="亮度" value={p.brightness} onChange={v=>set({...p,brightness:v})} disabled={r} refValue={60} isFail={gFail} />
    <ROIList isReadOnly />
  </div>);
};

/* ═══════════════════════════════════════════
   INSTALL DEBUGGING PAGE (装机调试)
   ═══════════════════════════════════════════ */
const InstallPage = ({ onHome }) => {
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState(Array(4).fill(STATUS.PENDING));
  const [isAutoAll, setIsAutoAll] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState(null);
  const autoRef = useRef(false);

  const [pose, setPose] = useState({ light1:40, light2:40, light3:40, exposure:80, gain:2.0, gamma:0.7, errX:80, errY:2.0, imgC:0.7, roiC:0.7 });
  const [clarity, setClarity] = useState({ clarity:80, mode:"auto", precision:80, speed:"high" });
  const [bright, setBright] = useState({ brightness:60, exposure:80, gain:2.0, gamma:0.7 });
  const [chroma, setChroma] = useState({ brightness:60, r:1000, g:600, b:1000 });
  const roiValues = { roi1: 172.5, roi2: 67.5, diff: 105 };

  const runStep = useCallback((i) => new Promise(resolve => {
    setStatuses(p => { const n=[...p]; n[i]=STATUS.RUNNING; return n; });
    setStep(i);
    setTimeout(() => {
      const pass = Math.random() > 0.2;
      setStatuses(p => { const n=[...p]; n[i]=pass?STATUS.PASS:STATUS.FAIL; return n; });
      resolve(pass);
    }, 1400 + Math.random() * 800);
  }), []);

  const runAll = useCallback(async () => {
    autoRef.current = true; setIsAutoAll(true);
    for (let i = 0; i < 4; i++) {
      if (!autoRef.current) break;
      const pass = await runStep(i);
      if (!pass) setToast({ message: `${INSTALL_STEPS[i].label} 未通过，可手动调整`, type: "error" });
      await new Promise(r => setTimeout(r, 300));
    }
    setIsAutoAll(false); autoRef.current = false; setShowSave(true);
  }, [runStep]);

  const isRunning = statuses[step] === STATUS.RUNNING;
  const stepId = INSTALL_STEPS[step].id;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepTabs steps={INSTALL_STEPS} current={step} statuses={statuses} onSelect={setStep} disabled={isAutoAll}
        rightAction={
          <button onClick={() => setShowConfirm(true)} disabled={isAutoAll}
            style={{ height: 30, padding: "0 16px", marginRight: 14, background: isAutoAll ? "#4a5a3a" : "linear-gradient(135deg,#8bc34a,#689f38)", border: "none", borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 500, cursor: isAutoAll ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
            {isAutoAll ? <><Loader2 size={13} className="spin" /> 调试中...</> : <><Zap size={13} /> 一键自动调试</>}
          </button>
        }
      />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <ImageArea step={stepId} showROIValues={stepId==="brightness"||stepId==="chroma"} roiValues={roiValues} />
        <div style={{ width: 330, background: "#252525", borderLeft: "1px solid #333", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
            {step===0 && <InstallPosePanel p={pose} set={setPose} status={statuses[0]} onAuto={()=>runStep(0)} />}
            {step===1 && <InstallClarityPanel p={clarity} set={setClarity} status={statuses[1]} onAuto={()=>runStep(1)} />}
            {step===2 && <InstallBrightnessPanel p={bright} set={setBright} status={statuses[2]} onAuto={()=>runStep(2)} roi={roiValues} />}
            {step===3 && <InstallChromaPanel p={chroma} set={setChroma} status={statuses[3]} onAuto={()=>runStep(3)} />}
          </div>
          <div style={{ height: 48, borderTop: "1px solid #333", display: "flex", flexShrink: 0 }}>
            <button onClick={() => {}} style={{ flex: 1, background: "transparent", border: "none", borderRight: "1px solid #333", color: "#888", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} disabled={isRunning||isAutoAll}>
              <Image size={13} /> 取图
            </button>
            <button onClick={() => {}} style={{ flex: 1, background: "transparent", border: "none", borderRight: "1px solid #333", color: "#888", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }} disabled={isRunning||isAutoAll}>
              <RotateCcw size={13} /> 重置
            </button>
            <button onClick={() => step<3?setStep(step+1):setShowSave(true)} disabled={isRunning||isAutoAll}
              style={{ flex: 1.2, background: (isRunning||isAutoAll) ? "transparent" : "linear-gradient(135deg,#8bc34a,#689f38)", border: "none", color: (isRunning||isAutoAll) ? "#555" : "#fff", fontSize: 13, fontWeight: 500, cursor: (isRunning||isAutoAll) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
              {step===3?"完成":"下一步"} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
      {showConfirm && <Modal onClose={()=>setShowConfirm(false)}>
        <p style={{ color: "#ddd", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>即将自动执行全部调试步骤，当前手动调整的参数将被覆盖，是否继续？</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={()=>setShowConfirm(false)} style={{ height: 34, padding: "0 18px", background: "transparent", border: "1px solid #555", borderRadius: 5, color: "#aaa", fontSize: 12, cursor: "pointer" }}>取消</button>
          <button onClick={()=>{setShowConfirm(false);setStatuses(Array(4).fill(STATUS.PENDING));runAll();}} style={{ height: 34, padding: "0 18px", background: "linear-gradient(135deg,#8bc34a,#689f38)", border: "none", borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>确认</button>
        </div>
      </Modal>}
      {showSave && <SaveModal statuses={statuses} steps={INSTALL_STEPS} onClose={()=>setShowSave(false)} onSave={(m,n) => { setShowSave(false); setToast({ message: m==="overwrite"?"已保存到 config1":`已保存为新配方「${n||"config2"}」`, type: "success" }); }} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
};

/* ═══════════════════════════════════════════
   ODS PAGE
   ═══════════════════════════════════════════ */
const ODSPage = ({ onHome }) => {
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState(Array(4).fill(STATUS.PENDING));
  const [isAutoAll, setIsAutoAll] = useState(false);
  const [hasStdRecipe, setHasStdRecipe] = useState(false);
  const [toast, setToast] = useState(null);
  const [failMap, setFailMap] = useState({});
  const [pointIdx, setPointIdx] = useState(0);
  const points = ["左工位-引导", "左工位-检测", "右工位-引导", "顶部-定位"];
  const autoRef = useRef(false);

  const [fov, setFov] = useState({ l1:40, l2:40, l3:40, exp:80, gain:2.0, gamma:0.7 });
  const [cla, setCla] = useState({ mode:"auto", threshold:80, precision:80, speed:"high" });
  const [bri, setBri] = useState({ brightness:55, exp:78, gain:2.1, gamma:0.7 });
  const [wb, setWb] = useState({ wbMode:"auto", r:1000, g:600, b:1000, brightness:58 });

  const runStep = useCallback((i) => new Promise(resolve => {
    setStatuses(p => { const n=[...p]; n[i]=STATUS.RUNNING; return n; });
    setStep(i);
    setTimeout(() => {
      const pass = Math.random() > 0.35;
      setStatuses(p => { const n=[...p]; n[i]=pass?STATUS.PASS:STATUS.FAIL; return n; });
      if (!pass) {
        const failKeys = [["y"],["clarity"],["fBright"],["gray","wb"]][i];
        const picked = failKeys.filter(() => Math.random() > 0.3);
        setFailMap(p => ({...p, [i]: picked.length ? picked : [failKeys[0]]}));
      } else {
        setFailMap(p => ({...p, [i]: []}));
      }
      resolve(pass);
    }, 1400 + Math.random() * 800);
  }), []);

  const runAll = useCallback(async () => {
    autoRef.current = true; setIsAutoAll(true);
    for (let i = 0; i < 4; i++) {
      if (!autoRef.current) break;
      const pass = await runStep(i);
      if (!pass) setToast({ message: `${ODS_STEPS[i].label} 未通过`, type: "error" });
      await new Promise(r => setTimeout(r, 300));
    }
    setIsAutoAll(false); autoRef.current = false;
  }, [runStep]);

  const switchPoint = (dir) => {
    const n = pointIdx + dir;
    if (n >= 0 && n < points.length) {
      setPointIdx(n);
      setStatuses(Array(4).fill(STATUS.PENDING));
      setFailMap({});
      setHasStdRecipe(true);
    }
  };

  const isRunning = statuses[step] === STATUS.RUNNING;
  const stepId = ODS_STEPS[step].id;

  // Recipe selection screen
  if (!hasStdRecipe) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 40, background: "#2a2a2a", borderBottom: "1px solid #333", display: "flex", alignItems: "center", padding: "0 14px", fontSize: 12, color: "#777" }}>
          <Home size={13} style={{ marginRight: 6 }} /> ODS 批量快速装机 · <span style={{ color: "#eee", marginLeft: 4 }}>{points[pointIdx]}</span>
        </div>
        <div style={{ flex: 1, display: "flex" }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a1a" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ marginBottom: 20 }}><WorkpieceSVG step="pose" /></div>
              <div style={{ color: "#aaa", fontSize: 13 }}>当前设备实拍图 · {points[pointIdx]}</div>
            </div>
          </div>
          <div style={{ width: 360, background: "#252525", borderLeft: "1px solid #333", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30 }}>
            <Scan size={40} color="#8bc34a" style={{ marginBottom: 16, opacity: 0.6 }} />
            <h3 style={{ color: "#eee", fontSize: 16, fontWeight: 600, marginBottom: 8 }}>选择标准配方</h3>
            <p style={{ color: "#888", fontSize: 12, textAlign: "center", lineHeight: 1.6, marginBottom: 24 }}>请选择一个标准配方作为比对基准，选择后将显示双图对比界面</p>
            {["标准配方A - 引导工位", "标准配方B - 检测工位", "标准配方C - 定位工位"].map((name, i) => (
              <div key={i} onClick={() => setHasStdRecipe(true)} style={{ width: "100%", padding: "10px 14px", background: "#1e1e1e", border: "1px solid #333", borderRadius: 6, marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "border-color 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#8bc34a"} onMouseLeave={e => e.currentTarget.style.borderColor = "#333"}>
                <div style={{ width: 40, height: 30, background: "#2a2a2a", borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}><Image size={14} color="#666" /></div>
                <div><div style={{ color: "#ccc", fontSize: 12, fontWeight: 500 }}>{name}</div><div style={{ color: "#666", fontSize: 10, marginTop: 2 }}>cam-line-1 · 2026-02-20</div></div>
                <ChevronRight size={14} color="#555" style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <StepTabs steps={ODS_STEPS} current={step} statuses={statuses} onSelect={setStep} disabled={isAutoAll}
        rightAction={
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 14 }}>
            <span style={{ fontSize: 11, color: "#777" }}>{points[pointIdx]}</span>
            <button onClick={runAll} disabled={isAutoAll}
              style={{ height: 30, padding: "0 16px", background: isAutoAll ? "#4a5a3a" : "linear-gradient(135deg,#8bc34a,#689f38)", border: "none", borderRadius: 5, color: "#fff", fontSize: 12, fontWeight: 500, cursor: isAutoAll ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
              {isAutoAll ? <><Loader2 size={13} className="spin" /> 评价中...</> : <><Zap size={13} /> 一键评价</>}
            </button>
          </div>
        }
      />
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Dual image area */}
        <div style={{ flex: 1, display: "flex" }}>
          <ImageArea step={stepId} label="标准" />
          <div style={{ width: 1, background: "#444" }} />
          <ImageArea step={stepId} label="当前" showROIValues={stepId==="brightness"||stepId==="wb"} roiValues={{ roi1: 142, roi2: 68.5, diff: 73.5 }} />
        </div>
        {/* Right panel */}
        <div style={{ width: 340, background: "#252525", borderLeft: "1px solid #333", display: "flex", flexDirection: "column", flexShrink: 0 }}>
          <div style={{ flex: 1, overflow: "auto", padding: 14 }}>
            {step===0 && <ODSFovPanel p={fov} set={setFov} status={statuses[0]} onAuto={()=>runStep(0)} failItems={failMap[0]} />}
            {step===1 && <ODSClarityPanel p={cla} set={setCla} status={statuses[1]} onAuto={()=>runStep(1)} failItems={failMap[1]} />}
            {step===2 && <ODSBrightnessPanel p={bri} set={setBri} status={statuses[2]} onAuto={()=>runStep(2)} failItems={failMap[2]} />}
            {step===3 && <ODSWBPanel p={wb} set={setWb} status={statuses[3]} onAuto={()=>runStep(3)} failItems={failMap[3]} />}
          </div>
          <div style={{ height: 48, borderTop: "1px solid #333", display: "flex", flexShrink: 0 }}>
            <button onClick={()=>switchPoint(-1)} disabled={pointIdx===0||isRunning||isAutoAll} style={{ flex: 1, background: "transparent", border: "none", borderRight: "1px solid #333", color: pointIdx===0?"#444":"#888", fontSize: 12, cursor: pointIdx===0?"not-allowed":"pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
              <ArrowLeft size={13} /> 上一点位
            </button>
            <button onClick={()=>setToast({message:"已标记为通过",type:"success"})} style={{ flex: 1, background: "transparent", border: "none", borderRight: "1px solid #333", color: "#8bc34a", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }} disabled={isRunning||isAutoAll}>
              <Check size={13} /> 标记通过
            </button>
            <button onClick={()=>setToast({message:"已保存到样机配方",type:"success"})} style={{ flex: 1, background: "transparent", border: "none", borderRight: "1px solid #333", color: "#64b5f6", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }} disabled={isRunning||isAutoAll}>
              <Save size={13} /> 保存样机
            </button>
            <button onClick={()=>switchPoint(1)} disabled={pointIdx===points.length-1||isRunning||isAutoAll} style={{ flex: 1, background: "transparent", border: "none", color: pointIdx===points.length-1?"#444":"#888", fontSize: 12, cursor: pointIdx===points.length-1?"not-allowed":"pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
              下一点位 <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={()=>setToast(null)} />}
    </div>
  );
};

/* ═══════════════════════════════════════════
   WORKBENCH HOME (工作台首页)
   ═══════════════════════════════════════════ */
const WorkbenchHome = ({ onNavigate }) => (
  <div style={{ flex: 1, background: "#333", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
    <h1 style={{ color: "#eee", fontSize: 36, fontWeight: 300, marginBottom: 12, letterSpacing: 2 }}>工作台</h1>
    <p style={{ color: "#999", fontSize: 14, marginBottom: 6 }}>请选择您的操作目标</p>
    <p style={{ color: "#777", fontSize: 13, marginBottom: 40 }}>您可以创建新的标准参数，或将现有参数快速应用到当前机台</p>
    <div style={{ display: "flex", gap: 24 }}>
      {[
        { key: "install", icon: Wrench, title: "制作标准样机", desc: "通过模版或自定义配方去调整相机、光源及对位参数，定义标准参数并生成配置文件。", color: "#8bc34a" },
        { key: "ods", icon: Monitor, title: "ODS 批量快速装机", desc: "适用于批量装机。基于标准配方对批量机台自动对齐参数，确保机台一致性。", color: "#8bc34a" },
      ].map(item => (
        <div key={item.key} onClick={() => onNavigate(item.key)}
          style={{ width: 340, background: "#f5f5f5", borderRadius: 10, padding: "30px 28px", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.3)"; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
          <div style={{ width: 48, height: 48, background: `${item.color}22`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
            <item.icon size={24} color={item.color} />
          </div>
          <h3 style={{ color: "#222", fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{item.title}</h3>
          <p style={{ color: "#888", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>{item.desc}</p>
          <span style={{ color: item.color, fontSize: 14, fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>进入 <ChevronRight size={16} /></span>
        </div>
      ))}
    </div>
  </div>
);

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "#1e1e1e", fontFamily: "'PingFang SC','Microsoft YaHei','Noto Sans SC',sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes slideDown { from { opacity:0; transform:translate(-50%,-10px); } to { opacity:1; transform:translate(-50%,0); } }
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; width:12px; height:12px; border-radius:50%; background:#8bc34a; border:2px solid #fff; cursor:pointer; box-shadow:0 1px 4px rgba(0,0,0,0.4); }
        input[type="range"]:disabled::-webkit-slider-thumb { background:#666; border-color:#888; cursor:not-allowed; }
        * { box-sizing:border-box; margin:0; padding:0; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:#1e1e1e; }
        ::-webkit-scrollbar-thumb { background:#444; border-radius:2px; }
      `}</style>
      <TopBar onHome={() => setPage("home")} />
      {page === "home" && <WorkbenchHome onNavigate={setPage} />}
      {page === "install" && <InstallPage onHome={() => setPage("home")} />}
      {page === "ods" && <ODSPage onHome={() => setPage("home")} />}
    </div>
  );
}
