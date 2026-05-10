import { useState, useEffect, createContext, useContext } from "react";

// ─── AUTH CONTEXT ────────────────────────────────────────────────────────────
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ─── DATA HELPERS (in-memory store) ──────────────────────────────────────────
let _store = {
  users: [
    { id: "u1", name: "Alex Rivera", email: "admin@demo.com", password: "demo123", role: "Admin" },
    { id: "u2", name: "Jordan Kim",  email: "member@demo.com", password: "demo123", role: "Member" },
  ],
  projects: [
    { id: "p1", name: "Website Redesign", description: "Revamp the company website", ownerId: "u1", memberIds: ["u1","u2"], createdAt: "2026-04-01" },
    { id: "p2", name: "Mobile App MVP",   description: "First version of iOS/Android app", ownerId: "u1", memberIds: ["u1"], createdAt: "2026-04-15" },
  ],
  tasks: [
    { id: "t1", projectId: "p1", title: "Design wireframes",    description: "Create lo-fi wireframes", assigneeId: "u2", status: "Done",        priority: "High",   dueDate: "2026-04-20", createdBy: "u1" },
    { id: "t2", projectId: "p1", title: "Build landing page",   description: "HTML/CSS implementation", assigneeId: "u2", status: "In Progress",  priority: "High",   dueDate: "2026-05-10", createdBy: "u1" },
    { id: "t3", projectId: "p1", title: "SEO audit",            description: "Analyze and fix SEO",     assigneeId: "u1", status: "Todo",         priority: "Medium", dueDate: "2026-05-20", createdBy: "u1" },
    { id: "t4", projectId: "p2", title: "Setup React Native",   description: "Boilerplate & nav",       assigneeId: "u1", status: "Done",         priority: "High",   dueDate: "2026-04-25", createdBy: "u1" },
    { id: "t5", projectId: "p2", title: "Auth screens",         description: "Login & signup UI",       assigneeId: "u1", status: "In Progress",  priority: "High",   dueDate: "2026-05-05", createdBy: "u1" },
    { id: "t6", projectId: "p1", title: "Copy review (OVERDUE)","description": "Final copy check",      assigneeId: "u2", status: "Todo",         priority: "Low",    dueDate: "2026-04-30", createdBy: "u1" },
  ],
};

const db = {
  getUsers: () => _store.users,
  getUser: (id) => _store.users.find(u => u.id === id),
  login: (email, password) => _store.users.find(u => u.email === email && u.password === password),
  signup: (name, email, password) => {
    if (_store.users.find(u => u.email === email)) return null;
    const u = { id: "u" + Date.now(), name, email, password, role: "Member" };
    _store.users.push(u);
    return u;
  },
  getProjects: (userId, role) =>
    role === "Admin"
      ? _store.projects
      : _store.projects.filter(p => p.memberIds.includes(userId)),
  getProject: (id) => _store.projects.find(p => p.id === id),
  createProject: (data) => {
    const p = { id: "p" + Date.now(), ...data, createdAt: new Date().toISOString().slice(0,10) };
    _store.projects.push(p);
    return p;
  },
  updateProject: (id, data) => {
    const i = _store.projects.findIndex(p => p.id === id);
    if (i >= 0) _store.projects[i] = { ..._store.projects[i], ...data };
    return _store.projects[i];
  },
  deleteProject: (id) => { _store.projects = _store.projects.filter(p => p.id !== id); },
  getTasks: (projectId) => _store.tasks.filter(t => t.projectId === projectId),
  getAllUserTasks: (userId) => _store.tasks.filter(t => t.assigneeId === userId),
  getAllTasks: () => _store.tasks,
  createTask: (data) => {
    const t = { id: "t" + Date.now(), ...data };
    _store.tasks.push(t);
    return t;
  },
  updateTask: (id, data) => {
    const i = _store.tasks.findIndex(t => t.id === id);
    if (i >= 0) _store.tasks[i] = { ..._store.tasks[i], ...data };
    return _store.tasks[i];
  },
  deleteTask: (id) => { _store.tasks = _store.tasks.filter(t => t.id !== id); },
};

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const STATUSES = ["Todo", "In Progress", "Done"];
const PRIORITIES = ["Low", "Medium", "High"];
const today = new Date().toISOString().slice(0, 10);

const STATUS_COLOR = {
  "Todo":        { bg: "#1e2a3a", text: "#64b5f6", border: "#1565c0" },
  "In Progress": { bg: "#1a2a1a", text: "#81c784", border: "#2e7d32" },
  "Done":        { bg: "#2a1a2a", text: "#ce93d8", border: "#6a1b9a" },
};
const PRIORITY_COLOR = {
  "Low":    "#78909c",
  "Medium": "#ffa726",
  "High":   "#ef5350",
};

// ─── STYLES ──────────────────────────────────────────────────────────────────
const G = {
  bg:       "#0a0e1a",
  surface:  "#111827",
  card:     "#161d2e",
  border:   "#1e2d45",
  accent:   "#3b82f6",
  accent2:  "#06b6d4",
  text:     "#e2e8f0",
  muted:    "#64748b",
  danger:   "#ef4444",
  success:  "#22c55e",
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${G.bg};color:${G.text};font-family:'DM Sans',sans-serif;min-height:100vh}
  ::-webkit-scrollbar{width:6px;height:6px}
  ::-webkit-scrollbar-track{background:${G.surface}}
  ::-webkit-scrollbar-thumb{background:${G.border};border-radius:3px}
  input,select,textarea{background:${G.surface};border:1px solid ${G.border};color:${G.text};
    border-radius:8px;padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;
    outline:none;width:100%;transition:border .2s}
  input:focus,select:focus,textarea:focus{border-color:${G.accent}}
  select option{background:${G.surface}}
  button{cursor:pointer;font-family:'DM Sans',sans-serif;border:none;transition:all .2s}
  .fade-in{animation:fadeIn .3s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
  @keyframes spin{to{transform:rotate(360deg)}}
  .page-title{font-family:'Syne',sans-serif;font-weight:800}
`;

// ─── UI PRIMITIVES ────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", size = "md", style: sx, disabled }) {
  const base = {
    borderRadius: 8, fontWeight: 500,
    padding: size === "sm" ? "6px 14px" : size === "lg" ? "12px 28px" : "9px 20px",
    fontSize: size === "sm" ? 13 : size === "lg" ? 16 : 14,
    display: "inline-flex", alignItems: "center", gap: 6,
    opacity: disabled ? 0.5 : 1,
  };
  const variants = {
    primary:  { background: G.accent, color: "#fff" },
    secondary:{ background: G.card, color: G.text, border: `1px solid ${G.border}` },
    danger:   { background: "#7f1d1d", color: "#fca5a5", border: "1px solid #991b1b" },
    ghost:    { background: "transparent", color: G.muted },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...sx }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = "0.85"; }}
      onMouseLeave={e => { e.currentTarget.style.opacity = "1"; }}>
      {children}
    </button>
  );
}

function Badge({ label, color, bg, border }) {
  return (
    <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
      background: bg, color, border: `1px solid ${border}`, letterSpacing: ".4px", whiteSpace: "nowrap" }}>
      {label}
    </span>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 1000,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-in" style={{ background: G.card, border: `1px solid ${G.border}`,
        borderRadius: 16, padding: 28, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: G.muted,
            fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: G.muted,
        textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Avatar({ name, size = 32 }) {
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";
  const hue = name ? (name.charCodeAt(0) * 37) % 360 : 200;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `hsl(${hue},55%,35%)`, display: "flex", alignItems: "center",
      justifyContent: "center", fontSize: size * 0.35, fontWeight: 700, color: "#fff",
      border: `2px solid hsl(${hue},55%,25%)` }}>
      {initials}
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "admin@demo.com", password: "demo123" });
  const [err, setErr] = useState("");

  const submit = () => {
    setErr("");
    if (mode === "login") {
      const u = db.login(form.email, form.password);
      if (!u) return setErr("Invalid email or password.");
      onLogin(u);
    } else {
      if (!form.name.trim()) return setErr("Name is required.");
      const u = db.signup(form.name, form.email, form.password);
      if (!u) return setErr("Email already in use.");
      onLogin(u);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", padding: 16,
      background: `radial-gradient(ellipse at 20% 50%, #0f1f3d 0%, ${G.bg} 60%)` }}>
      <div className="fade-in" style={{ width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10,
            background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: "10px 20px" }}>
            <span style={{ fontSize: 24 }}>⬡</span>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22,
              background: `linear-gradient(90deg, ${G.accent}, ${G.accent2})`,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              TaskFlow
            </span>
          </div>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 10 }}>Team Task Manager</p>
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`,
          borderRadius: 16, padding: 32 }}>
          <div style={{ display: "flex", background: G.surface, borderRadius: 10,
            padding: 4, marginBottom: 24 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: "8px 0", borderRadius: 8, border: "none",
                background: mode === m ? G.accent : "transparent",
                color: mode === m ? "#fff" : G.muted, fontWeight: 600, fontSize: 14,
                cursor: "pointer", textTransform: "capitalize", transition: "all .2s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <Field label="Full Name">
              <input value={form.name} placeholder="Your name"
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </Field>
          )}
          <Field label="Email">
            <input type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <input type="password" value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              onKeyDown={e => e.key === "Enter" && submit()} />
          </Field>

          {err && <p style={{ color: G.danger, fontSize: 13, marginBottom: 14 }}>⚠ {err}</p>}

          <Btn onClick={submit} size="lg" style={{ width: "100%" }}>
            {mode === "login" ? "Sign In →" : "Create Account →"}
          </Btn>

          <div style={{ marginTop: 20, padding: 12, background: G.surface, borderRadius: 8 }}>
            <p style={{ fontSize: 12, color: G.muted, marginBottom: 6, fontWeight: 600 }}>DEMO ACCOUNTS</p>
            <p style={{ fontSize: 12, color: G.muted }}>Admin: admin@demo.com / demo123</p>
            <p style={{ fontSize: 12, color: G.muted }}>Member: member@demo.com / demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, setPage, user, onLogout, projects }) {
  const [collapsed, setCollapsed] = useState(false);
  const nav = [
    { id: "dashboard", icon: "◈", label: "Dashboard" },
    { id: "projects",  icon: "⬡", label: "Projects" },
    { id: "tasks",     icon: "✦", label: "My Tasks" },
    ...(user.role === "Admin" ? [{ id: "team", icon: "◉", label: "Team" }] : []),
  ];
  return (
    <aside style={{ width: collapsed ? 64 : 220, background: G.surface,
      borderRight: `1px solid ${G.border}`, display: "flex", flexDirection: "column",
      transition: "width .25s", flexShrink: 0, height: "100vh", position: "sticky", top: 0 }}>
      {/* Header */}
      <div style={{ padding: collapsed ? "18px 12px" : "18px 20px", borderBottom: `1px solid ${G.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        {!collapsed && (
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18,
            background: `linear-gradient(90deg, ${G.accent}, ${G.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            TaskFlow
          </span>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ background: "none", border: "none",
          color: G.muted, cursor: "pointer", fontSize: 18, marginLeft: collapsed ? "auto" : 0 }}>
          {collapsed ? "▷" : "◁"}
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 8px", overflowY: "auto" }}>
        {nav.map(({ id, icon, label }) => {
          const active = page === id;
          return (
            <button key={id} onClick={() => setPage(id)} title={collapsed ? label : ""}
              style={{ width: "100%", display: "flex", alignItems: "center",
                gap: 10, padding: collapsed ? "10px 0" : "10px 12px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? `${G.accent}22` : "none",
                borderRadius: 8, border: active ? `1px solid ${G.accent}44` : "1px solid transparent",
                color: active ? G.accent : G.muted, fontWeight: active ? 600 : 400,
                fontSize: 14, marginBottom: 2, cursor: "pointer", transition: "all .15s" }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
              {!collapsed && label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: collapsed ? 8 : 16, borderTop: `1px solid ${G.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Avatar name={user.name} size={34} />
          {!collapsed && (
            <div style={{ overflow: "hidden" }}>
              <p style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
                overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</p>
              <p style={{ fontSize: 11, color: G.muted }}>{user.role}</p>
            </div>
          )}
        </div>
        <button onClick={onLogout} title="Sign out"
          style={{ width: "100%", background: "none", border: `1px solid ${G.border}`,
            borderRadius: 7, color: G.muted, fontSize: 12, padding: collapsed ? "6px 0" : "6px 12px",
            cursor: "pointer", display: "flex", alignItems: "center",
            justifyContent: collapsed ? "center" : "flex-start", gap: 6 }}>
          ⎋ {!collapsed && "Sign Out"}
        </button>
      </div>
    </aside>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function Dashboard({ user }) {
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  const allTasks = db.getAllTasks();
  const myTasks  = db.getAllUserTasks(user.id);
  const projects = db.getProjects(user.id, user.role);

  const stats = [
    { label: "Total Projects", value: projects.length, icon: "⬡", color: G.accent },
    { label: "Total Tasks",    value: allTasks.filter(t => projects.some(p=>p.id===t.projectId)).length, icon: "✦", color: G.accent2 },
    { label: "My Tasks",       value: myTasks.length, icon: "◈", color: "#a78bfa" },
    { label: "Overdue",        value: allTasks.filter(t => t.dueDate < today && t.status !== "Done").length, icon: "⚑", color: G.danger },
  ];

  const recentTasks = [...allTasks]
    .filter(t => projects.some(p => p.id === t.projectId))
    .slice(-6).reverse();

  return (
    <div className="fade-in">
      <h1 className="page-title" style={{ fontSize: 28, marginBottom: 6 }}>
        Good day, {user.name.split(" ")[0]} 👋
      </h1>
      <p style={{ color: G.muted, fontSize: 14, marginBottom: 28 }}>
        {new Date().toLocaleDateString("en-US", { weekday:"long", year:"numeric", month:"long", day:"numeric" })}
      </p>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 16, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: G.card, border: `1px solid ${G.border}`,
            borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ color: G.muted, fontSize: 12, fontWeight: 600,
                  textTransform: "uppercase", letterSpacing: ".5px", marginBottom: 8 }}>{s.label}</p>
                <p style={{ fontSize: 36, fontFamily: "'Syne',sans-serif", fontWeight: 800,
                  color: s.color, lineHeight: 1 }}>{s.value}</p>
              </div>
              <span style={{ fontSize: 24, color: s.color, opacity: .5 }}>{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
            Task Status
          </h3>
          {STATUSES.map(s => {
            const count = recentTasks.filter(t => t.status === s).length;
            const total = recentTasks.length || 1;
            const c = STATUS_COLOR[s];
            return (
              <div key={s} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13,
                  marginBottom: 5 }}>
                  <span style={{ color: c.text }}>{s}</span>
                  <span style={{ color: G.muted }}>{count}</span>
                </div>
                <div style={{ height: 6, background: G.surface, borderRadius: 99 }}>
                  <div style={{ height: 6, background: c.text, borderRadius: 99,
                    width: `${(count / total) * 100}%`, transition: "width .4s" }} />
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
          <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
            Priority Breakdown
          </h3>
          {PRIORITIES.map(p => {
            const count = recentTasks.filter(t => t.priority === p).length;
            const total = recentTasks.length || 1;
            return (
              <div key={p} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: PRIORITY_COLOR[p] }}>{p}</span>
                  <span style={{ color: G.muted }}>{count}</span>
                </div>
                <div style={{ height: 6, background: G.surface, borderRadius: 99 }}>
                  <div style={{ height: 6, background: PRIORITY_COLOR[p], borderRadius: 99,
                    width: `${(count / total) * 100}%`, transition: "width .4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent tasks */}
      <div style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: 14, padding: 20 }}>
        <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight: 700, marginBottom: 16, fontSize: 15 }}>
          Recent Tasks
        </h3>
        {recentTasks.length === 0 && <p style={{ color: G.muted, fontSize: 13 }}>No tasks yet.</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recentTasks.map(t => {
            const project = db.getProject(t.projectId);
            const assignee = db.getUser(t.assigneeId);
            const overdue = t.dueDate < today && t.status !== "Done";
            const sc = STATUS_COLOR[t.status];
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", background: G.surface, borderRadius: 10,
                border: `1px solid ${overdue ? G.danger + "44" : G.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 2,
                    color: overdue ? "#fca5a5" : G.text }}>{t.title}</p>
                  <p style={{ fontSize: 11, color: G.muted }}>{project?.name}</p>
                </div>
                <Badge label={t.status} color={sc.text} bg={sc.bg} border={sc.border} />
                <Avatar name={assignee?.name} size={26} />
                <span style={{ fontSize: 11, color: overdue ? G.danger : G.muted,
                  whiteSpace: "nowrap" }}>{t.dueDate}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── PROJECT FORM ─────────────────────────────────────────────────────────────
function ProjectForm({ initial, user, onSave, onClose }) {
  const allUsers = db.getUsers();
  const [form, setForm] = useState(initial || {
    name: "", description: "", ownerId: user.id, memberIds: [user.id]
  });
  const save = () => {
    if (!form.name.trim()) return;
    if (initial) db.updateProject(initial.id, form);
    else db.createProject({ ...form, ownerId: user.id });
    onSave();
    onClose();
  };
  const toggleMember = (uid) => {
    const m = form.memberIds.includes(uid)
      ? form.memberIds.filter(x => x !== uid)
      : [...form.memberIds, uid];
    setForm({ ...form, memberIds: m });
  };
  return (
    <>
      <Field label="Project Name">
        <input value={form.name} placeholder="e.g. Website Redesign"
          onChange={e => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea rows={3} value={form.description} placeholder="What's this project about?"
          onChange={e => setForm({ ...form, description: e.target.value })} />
      </Field>
      <Field label="Team Members">
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
          {allUsers.map(u => (
            <label key={u.id} style={{ display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer", fontSize: 14 }}>
              <input type="checkbox" checked={form.memberIds.includes(u.id)}
                onChange={() => toggleMember(u.id)} style={{ width: "auto" }} />
              <Avatar name={u.name} size={24} />
              <span>{u.name}</span>
              <Badge label={u.role} color={u.role==="Admin"?G.accent:G.muted}
                bg={G.surface} border={G.border} />
            </label>
          ))}
        </div>
      </Field>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>{initial ? "Save Changes" : "Create Project"}</Btn>
      </div>
    </>
  );
}

// ─── TASK FORM ────────────────────────────────────────────────────────────────
function TaskForm({ initial, projectId, user, onSave, onClose }) {
  const project = db.getProject(projectId);
  const members = (project?.memberIds || []).map(id => db.getUser(id)).filter(Boolean);
  const [form, setForm] = useState(initial || {
    title: "", description: "", assigneeId: user.id,
    status: "Todo", priority: "Medium",
    dueDate: new Date(Date.now() + 7*86400000).toISOString().slice(0,10),
    projectId, createdBy: user.id
  });
  const save = () => {
    if (!form.title.trim()) return;
    if (initial) db.updateTask(initial.id, form);
    else db.createTask(form);
    onSave();
    onClose();
  };
  return (
    <>
      <Field label="Title">
        <input value={form.title} placeholder="Task name"
          onChange={e => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Description">
        <textarea rows={2} value={form.description} placeholder="Optional details"
          onChange={e => setForm({ ...form, description: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Status">
          <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Priority">
          <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {PRIORITIES.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Assignee">
          <select value={form.assigneeId} onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
            {members.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Due Date">
          <input type="date" value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
        <Btn onClick={save}>{initial ? "Save Changes" : "Add Task"}</Btn>
      </div>
    </>
  );
}

// ─── PROJECT DETAIL (Kanban) ──────────────────────────────────────────────────
function ProjectDetail({ project, user, onBack, onRefresh }) {
  const [tasks, setTasks] = useState(() => db.getTasks(project.id));
  const [addModal, setAddModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [dragTask, setDragTask] = useState(null);

  const refresh = () => setTasks(db.getTasks(project.id));
  const canEdit = user.role === "Admin" || project.memberIds.includes(user.id);

  const onDrop = (status) => {
    if (!dragTask) return;
    db.updateTask(dragTask.id, { status });
    refresh();
    setDragTask(null);
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>
        <div style={{ flex: 1 }}>
          <h1 className="page-title" style={{ fontSize: 26 }}>{project.name}</h1>
          <p style={{ color: G.muted, fontSize: 13 }}>{project.description}</p>
        </div>
        {canEdit && <Btn onClick={() => setAddModal(true)}>+ Add Task</Btn>}
      </div>

      {/* Members */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <span style={{ fontSize: 12, color: G.muted, fontWeight: 600 }}>TEAM:</span>
        {project.memberIds.map(id => {
          const u = db.getUser(id);
          return u ? (
            <div key={id} title={u.name}>
              <Avatar name={u.name} size={28} />
            </div>
          ) : null;
        })}
      </div>

      {/* Kanban */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {STATUSES.map(status => {
          const col = tasks.filter(t => t.status === status);
          const sc = STATUS_COLOR[status];
          return (
            <div key={status}
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop(status)}
              style={{ background: G.card, border: `1px solid ${sc.border}44`,
                borderRadius: 14, padding: 16, minHeight: 200 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%",
                    background: sc.text }} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: sc.text }}>{status}</span>
                </div>
                <span style={{ fontSize: 12, color: G.muted,
                  background: G.surface, borderRadius: 99, padding: "2px 8px" }}>{col.length}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {col.map(task => {
                  const assignee = db.getUser(task.assigneeId);
                  const overdue = task.dueDate < today && task.status !== "Done";
                  return (
                    <div key={task.id} draggable
                      onDragStart={() => setDragTask(task)}
                      style={{ background: G.surface, border: `1px solid ${overdue ? G.danger+"55":G.border}`,
                        borderRadius: 10, padding: "12px 14px", cursor: "grab",
                        borderLeft: `3px solid ${PRIORITY_COLOR[task.priority]}` }}>
                      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 6,
                        color: overdue ? "#fca5a5" : G.text }}>{task.title}</p>
                      {task.description && (
                        <p style={{ fontSize: 11, color: G.muted, marginBottom: 8 }}>{task.description}</p>
                      )}
                      <div style={{ display: "flex", justifyContent: "space-between",
                        alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <Avatar name={assignee?.name} size={20} />
                          <span style={{ fontSize: 11, color: G.muted }}>{assignee?.name?.split(" ")[0]}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 11, color: overdue ? G.danger : G.muted }}>
                            {overdue ? "⚑ " : ""}{task.dueDate}
                          </span>
                          {canEdit && (
                            <button onClick={() => setEditTask(task)}
                              style={{ background: "none", border: "none", color: G.muted,
                                cursor: "pointer", fontSize: 14, padding: 0 }}>✎</button>
                          )}
                          {user.role === "Admin" && (
                            <button onClick={() => { db.deleteTask(task.id); refresh(); onRefresh(); }}
                              style={{ background: "none", border: "none", color: G.danger,
                                cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {addModal && (
        <Modal title="Add Task" onClose={() => setAddModal(false)}>
          <TaskForm projectId={project.id} user={user}
            onSave={() => { refresh(); onRefresh(); }} onClose={() => setAddModal(false)} />
        </Modal>
      )}
      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm initial={editTask} projectId={project.id} user={user}
            onSave={() => { refresh(); onRefresh(); setEditTask(null); }}
            onClose={() => setEditTask(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── PROJECTS PAGE ────────────────────────────────────────────────────────────
function ProjectsPage({ user }) {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  const refresh = () => setTick(t => t + 1);
  const projects = db.getProjects(user.id, user.role);

  if (activeProject) {
    const proj = db.getProject(activeProject);
    if (proj) return (
      <ProjectDetail project={proj} user={user}
        onBack={() => setActiveProject(null)} onRefresh={refresh} />
    );
  }

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <h1 className="page-title" style={{ fontSize: 28 }}>Projects</h1>
          <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>{projects.length} project{projects.length!==1?"s":""}</p>
        </div>
        {user.role === "Admin" && <Btn onClick={() => setModal(true)}>+ New Project</Btn>}
      </div>

      {projects.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: G.muted }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>⬡</p>
          <p>No projects yet. Create your first one!</p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {projects.map(p => {
          const tasks = db.getTasks(p.id);
          const done = tasks.filter(t => t.status === "Done").length;
          const total = tasks.length;
          const overdue = tasks.filter(t => t.dueDate < today && t.status !== "Done").length;
          const pct = total ? Math.round((done/total)*100) : 0;
          return (
            <div key={p.id} style={{ background: G.card, border: `1px solid ${G.border}`,
              borderRadius: 16, padding: 22, cursor: "pointer", transition: "border .2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = G.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = G.border}
              onClick={() => setActiveProject(p.id)}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <h3 style={{ fontFamily:"'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>{p.name}</h3>
                {user.role === "Admin" && (
                  <div style={{ display: "flex", gap: 6 }} onClick={e => e.stopPropagation()}>
                    <Btn size="sm" variant="ghost" onClick={() => setEditProject(p)} style={{ padding: "4px 8px" }}>✎</Btn>
                    <Btn size="sm" variant="danger" onClick={() => { db.deleteProject(p.id); refresh(); }}
                      style={{ padding: "4px 8px" }}>✕</Btn>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 13, color: G.muted, marginBottom: 16, minHeight: 36 }}>{p.description}</p>

              {/* Progress */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12,
                  color: G.muted, marginBottom: 5 }}>
                  <span>Progress</span><span style={{ color: G.accent }}>{pct}%</span>
                </div>
                <div style={{ height: 5, background: G.surface, borderRadius: 99 }}>
                  <div style={{ height: 5, background: `linear-gradient(90deg,${G.accent},${G.accent2})`,
                    borderRadius: 99, width: `${pct}%`, transition: "width .5s" }} />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <span style={{ fontSize: 12, color: G.muted }}>{done}/{total} tasks</span>
                  {overdue > 0 && (
                    <span style={{ fontSize: 12, color: G.danger }}>⚑ {overdue} overdue</span>
                  )}
                </div>
                <div style={{ display: "flex" }}>
                  {p.memberIds.slice(0, 4).map((id, i) => (
                    <div key={id} style={{ marginLeft: i > 0 ? -8 : 0 }}>
                      <Avatar name={db.getUser(id)?.name} size={24} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <Modal title="New Project" onClose={() => setModal(false)}>
          <ProjectForm user={user} onSave={refresh} onClose={() => setModal(false)} />
        </Modal>
      )}
      {editProject && (
        <Modal title="Edit Project" onClose={() => setEditProject(null)}>
          <ProjectForm initial={editProject} user={user} onSave={refresh}
            onClose={() => setEditProject(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── MY TASKS PAGE ────────────────────────────────────────────────────────────
function MyTasksPage({ user }) {
  const [tick, setTick] = useState(0);
  const [filter, setFilter] = useState("All");
  const [editTask, setEditTask] = useState(null);

  const refresh = () => setTick(t => t + 1);
  const myTasks = db.getAllUserTasks(user.id);
  const filtered = filter === "All" ? myTasks : myTasks.filter(t => t.status === filter);

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title" style={{ fontSize: 28 }}>My Tasks</h1>
        <p style={{ color: G.muted, fontSize: 13, marginTop: 4 }}>{myTasks.length} assigned task{myTasks.length!==1?"s":""}</p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["All", ...STATUSES].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: "7px 16px", borderRadius: 99, border: "none", fontSize: 13, cursor: "pointer",
            background: filter === s ? G.accent : G.card,
            color: filter === s ? "#fff" : G.muted,
            fontWeight: filter === s ? 600 : 400 }}>
            {s}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: G.muted }}>
          <p style={{ fontSize: 36, marginBottom: 10 }}>✦</p>
          <p>No tasks here.</p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(task => {
          const project = db.getProject(task.projectId);
          const overdue = task.dueDate < today && task.status !== "Done";
          const sc = STATUS_COLOR[task.status];
          return (
            <div key={task.id} style={{ background: G.card, border: `1px solid ${overdue?G.danger+"44":G.border}`,
              borderRadius: 12, padding: "16px 18px", display: "flex",
              alignItems: "center", gap: 14,
              borderLeft: `4px solid ${PRIORITY_COLOR[task.priority]}` }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, fontSize: 14, marginBottom: 4,
                  color: overdue ? "#fca5a5" : G.text }}>
                  {overdue && "⚑ "}{task.title}
                </p>
                <p style={{ fontSize: 12, color: G.muted }}>{project?.name}</p>
              </div>
              <Badge label={task.priority} color={PRIORITY_COLOR[task.priority]}
                bg={G.surface} border={G.border} />
              <Badge label={task.status} color={sc.text} bg={sc.bg} border={sc.border} />
              <span style={{ fontSize: 12, color: overdue ? G.danger : G.muted,
                whiteSpace: "nowrap" }}>{task.dueDate}</span>
              {/* Quick status update */}
              <select value={task.status}
                onChange={e => { db.updateTask(task.id, { status: e.target.value }); refresh(); }}
                style={{ width: "auto", fontSize: 12, padding: "4px 8px",
                  background: G.surface, border: `1px solid ${G.border}`, borderRadius: 6, color: G.muted }}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <Btn size="sm" variant="ghost" onClick={() => setEditTask(task)}>✎</Btn>
            </div>
          );
        })}
      </div>

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm initial={editTask} projectId={editTask.projectId} user={user}
            onSave={() => { refresh(); setEditTask(null); }}
            onClose={() => setEditTask(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── TEAM PAGE (Admin only) ───────────────────────────────────────────────────
function TeamPage({ user }) {
  const users = db.getUsers();
  return (
    <div className="fade-in">
      <h1 className="page-title" style={{ fontSize: 28, marginBottom: 28 }}>Team</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 16 }}>
        {users.map(u => {
          const tasks = db.getAllUserTasks(u.id);
          const done = tasks.filter(t => t.status === "Done").length;
          const inProgress = tasks.filter(t => t.status === "In Progress").length;
          return (
            <div key={u.id} style={{ background: G.card, border: `1px solid ${G.border}`,
              borderRadius: 16, padding: 22 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <Avatar name={u.name} size={48} />
                <div>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontWeight: 700, fontSize: 16 }}>{u.name}</p>
                  <p style={{ fontSize: 12, color: G.muted }}>{u.email}</p>
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <Badge label={u.role}
                  color={u.role==="Admin"?G.accent:G.accent2}
                  bg={u.role==="Admin"?`${G.accent}22`:`${G.accent2}22`}
                  border={u.role==="Admin"?`${G.accent}44`:`${G.accent2}44`} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  { label: "Total", value: tasks.length, color: G.text },
                  { label: "Active", value: inProgress, color: STATUS_COLOR["In Progress"].text },
                  { label: "Done", value: done, color: STATUS_COLOR["Done"].text },
                ].map(s => (
                  <div key={s.label} style={{ background: G.surface, borderRadius: 8,
                    padding: "8px 10px", textAlign: "center" }}>
                    <p style={{ fontSize: 20, fontFamily:"'Syne',sans-serif",
                      fontWeight: 800, color: s.color }}>{s.value}</p>
                    <p style={{ fontSize: 11, color: G.muted }}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [tick, setTick] = useState(0);

  const refresh = () => setTick(t => t + 1);

  return (
    <>
      <style>{css}</style>
      {!user ? (
        <AuthPage onLogin={setUser} />
      ) : (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
          <Sidebar page={page} setPage={setPage} user={user}
            onLogout={() => setUser(null)} projects={db.getProjects(user.id, user.role)} />
          <main style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
            {page === "dashboard" && <Dashboard key={tick} user={user} />}
            {page === "projects"  && <ProjectsPage key={tick} user={user} />}
            {page === "tasks"     && <MyTasksPage key={tick} user={user} />}
            {page === "team"      && user.role === "Admin" && <TeamPage key={tick} user={user} />}
          </main>
        </div>
      )}
    </>
  );
}