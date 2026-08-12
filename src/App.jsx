import { useState, useEffect, useRef, useCallback } from "react";

// ── Fonts ──────────────────────────────────────────────────────────────────
const FONT_LINK = document.createElement("link");
FONT_LINK.rel = "stylesheet";
FONT_LINK.href =
"https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap";
document.head.appendChild(FONT_LINK);

// ── Helpers ────────────────────────────────────────────────────────────────
const todayKey = () => new Date().toISOString().slice(0, 10);
const tomorrowKey = () => {
const d = new Date();
d.setDate(d.getDate() + 1);
return d.toISOString().slice(0, 10);
};
const uid = () => Math.random().toString(36).slice(2, 9);

const loadTasks = () => {
try {
return JSON.parse(localStorage.getItem("dg_tasks") || "{}");
} catch {
return {};
}
};
const saveTasks = (data) =>
localStorage.setItem("dg_tasks", JSON.stringify(data));

// ── CSS ────────────────────────────────────────────────────────────────────
const styles = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
--black: #000000;
--white: #ffffff;
--gray-100: #f5f5f5;
--gray-300: #d4d4d4;
--gray-500: #737373;
--gray-700: #404040;
--gray-800: #262626;
--gray-900: #171717;
--font-head: 'Syne', sans-serif;
--font-mono: 'DM Mono', monospace;
--radius: 12px;
--radius-sm: 6px;
}

html, body, #root {
height: 100%;
background: var(--black);
color: var(--white);
font-family: var(--font-head);
-webkit-font-smoothing: antialiased;
overscroll-behavior: none;
}

.app {
max-width: 420px;
margin: 0 auto;
min-height: 100dvh;
display: flex;
flex-direction: column;
padding: 0 0 120px;
position: relative;
}

/* ── Header ── */
.header {
padding: 52px 24px 28px;
border-bottom: 1px solid var(--gray-900);
position: sticky;
top: 0;
background: var(--black);
z-index: 10;
}
.header-meta {
font-family: var(--font-mono);
font-size: 10px;
font-weight: 400;
letter-spacing: 0.18em;
color: var(--gray-500);
text-transform: uppercase;
margin-bottom: 6px;
}
.header-title {
font-size: 28px;
font-weight: 800;
letter-spacing: -0.03em;
line-height: 1;
}
.header-sub {
font-family: var(--font-mono);
font-size: 11px;
color: var(--gray-500);
margin-top: 6px;
}
.progress-bar-wrap {
margin-top: 16px;
height: 2px;
background: var(--gray-900);
border-radius: 99px;
overflow: hidden;
}
.progress-bar-fill {
height: 100%;
background: var(--white);
border-radius: 99px;
transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.progress-label {
font-family: var(--font-mono);
font-size: 10px;
color: var(--gray-500);
margin-top: 6px;
display: flex;
justify-content: space-between;
}

/* ── Tab Bar ── */
.tabs {
display: flex;
gap: 0;
padding: 16px 24px 0;
position: sticky;
top: 155px;
background: var(--black);
z-index: 9;
}
.tab-btn {
flex: 1;
background: none;
border: none;
cursor: pointer;
padding: 10px 0;
font-family: var(--font-mono);
font-size: 10px;
letter-spacing: 0.14em;
text-transform: uppercase;
color: var(--gray-500);
border-bottom: 1.5px solid var(--gray-800);
transition: color 0.2s, border-color 0.2s;
}
.tab-btn.active {
color: var(--white);
border-bottom-color: var(--white);
}

/* ── Task List ── */
.task-list {
padding: 4px 0;
flex: 1;
}

.empty-state {
padding: 72px 24px;
text-align: center;
}
.empty-icon {
font-size: 36px;
margin-bottom: 16px;
opacity: 0.3;
}
.empty-title {
font-size: 17px;
font-weight: 600;
color: var(--gray-500);
margin-bottom: 6px;
}
.empty-sub {
font-family: var(--font-mono);
font-size: 11px;
color: var(--gray-700);
line-height: 1.6;
}

/* ── Task Item ── */
.task-item {
display: flex;
align-items: flex-start;
gap: 14px;
padding: 16px 24px;
border-bottom: 1px solid var(--gray-900);
position: relative;
animation: slideIn 0.24s cubic-bezier(0.4, 0, 0.2, 1);
touch-action: pan-y;
transition: background 0.15s;
}
.task-item:active { background: var(--gray-900); }
.task-item.done { opacity: 0.45; }
.task-item.deleting {
animation: slideOut 0.22s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideIn {
from { opacity: 0; transform: translateY(-8px); }
to   { opacity: 1; transform: translateY(0); }
}
@keyframes slideOut {
from { opacity: 1; transform: translateX(0); max-height: 80px; }
to   { opacity: 0; transform: translateX(-24px); max-height: 0; padding: 0 24px; }
}

.task-num {
font-family: var(--font-mono);
font-size: 10px;
color: var(--gray-700);
min-width: 18px;
padding-top: 3px;
user-select: none;
}

/* Checkbox */
.task-check {
width: 22px;
height: 22px;
min-width: 22px;
border-radius: 50%;
border: 1.5px solid var(--gray-700);
background: none;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
transition: border-color 0.2s, background 0.2s, transform 0.15s;
margin-top: 1px;
}
.task-check:active { transform: scale(0.88); }
.task-check.checked {
background: var(--white);
border-color: var(--white);
}
.checkmark {
opacity: 0;
transform: scale(0.3) rotate(-10deg);
transition: opacity 0.2s, transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
display: flex;
align-items: center;
justify-content: center;
}
.task-check.checked .checkmark {
opacity: 1;
transform: scale(1) rotate(0deg);
}

.task-body { flex: 1; min-width: 0; }

.task-text {
font-size: 15px;
font-weight: 500;
line-height: 1.45;
letter-spacing: -0.01em;
word-break: break-word;
cursor: pointer;
}
.task-item.done .task-text {
text-decoration: line-through;
color: var(--gray-500);
}

.task-edit-input {
width: 100%;
background: none;
border: none;
border-bottom: 1px solid var(--gray-500);
color: var(--white);
font-family: var(--font-head);
font-size: 15px;
font-weight: 500;
padding: 2px 0 4px;
outline: none;
letter-spacing: -0.01em;
}

.task-actions {
display: flex;
gap: 4px;
align-items: center;
padding-top: 1px;
}
.icon-btn {
background: none;
border: none;
cursor: pointer;
color: var(--gray-700);
width: 28px;
height: 28px;
display: flex;
align-items: center;
justify-content: center;
border-radius: 6px;
transition: color 0.15s, background 0.15s;
flex-shrink: 0;
}
.icon-btn:hover { color: var(--white); background: var(--gray-800); }
.icon-btn.danger:hover { color: #ff4d4d; background: rgba(255,77,77,0.1); }

/* Drag handle */
.drag-handle {
color: var(--gray-800);
cursor: grab;
padding-top: 3px;
user-select: none;
}
.drag-handle:active { cursor: grabbing; }
.task-item.dragging {
opacity: 0.5;
background: var(--gray-900);
}

/* ── Input Area ── */
.input-area {
position: fixed;
bottom: 0;
left: 50%;
transform: translateX(-50%);
width: 100%;
max-width: 420px;
background: var(--black);
border-top: 1px solid var(--gray-900);
padding: 16px 20px 28px;
z-index: 20;
}
.input-row {
display: flex;
gap: 10px;
align-items: center;
background: var(--gray-900);
border: 1px solid var(--gray-800);
border-radius: var(--radius);
padding: 4px 4px 4px 16px;
transition: border-color 0.2s;
}
.input-row:focus-within { border-color: var(--gray-500); }

.task-input {
flex: 1;
background: none;
border: none;
color: var(--white);
font-family: var(--font-head);
font-size: 15px;
font-weight: 500;
outline: none;
padding: 10px 0;
letter-spacing: -0.01em;
}
.task-input::placeholder { color: var(--gray-700); }

.add-btn {
background: var(--white);
color: var(--black);
border: none;
cursor: pointer;
width: 38px;
height: 38px;
border-radius: 8px;
display: flex;
align-items: center;
justify-content: center;
font-size: 20px;
font-weight: 300;
flex-shrink: 0;
transition: transform 0.15s, opacity 0.15s;
}
.add-btn:active { transform: scale(0.91); }
.add-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.input-hint {
font-family: var(--font-mono);
font-size: 10px;
color: var(--gray-700);
margin-top: 8px;
padding: 0 4px;
display: flex;
justify-content: space-between;
align-items: center;
}
.carry-btn {
background: none;
border: 1px solid var(--gray-800);
color: var(--gray-500);
font-family: var(--font-mono);
font-size: 10px;
letter-spacing: 0.08em;
padding: 4px 10px;
border-radius: 4px;
cursor: pointer;
transition: border-color 0.2s, color 0.2s;
}
.carry-btn:hover { border-color: var(--gray-500); color: var(--white); }

/* Toast */
.toast {
position: fixed;
bottom: 120px;
left: 50%;
transform: translateX(-50%) translateY(10px);
background: var(--white);
color: var(--black);
font-family: var(--font-mono);
font-size: 12px;
letter-spacing: 0.06em;
padding: 10px 20px;
border-radius: 8px;
z-index: 99;
opacity: 0;
pointer-events: none;
transition: opacity 0.2s, transform 0.2s;
}
.toast.show {
opacity: 1;
transform: translateX(-50%) translateY(0);
}

/* Scrollbar */
::-webkit-scrollbar { width: 0; }
`;

// ── Inject styles ──────────────────────────────────────────────────────────
const styleEl = document.createElement("style");
styleEl.textContent = styles;
document.head.appendChild(styleEl);

// ── Icons ──────────────────────────────────────────────────────────────────
const CheckIcon = () => (
<svg width="12" height="10" viewBox="0 0 12 10" fill="none">
<path d="M1 5L4.5 8.5L11 1" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
);
const TrashIcon = () => (
<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
<path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M2.5 3.5l.8 8a.5.5 0 00.5.5h6.4a.5.5 0 00.5-.5l.8-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
</svg>
);
const DragIcon = () => (
<svg width="12" height="14" viewBox="0 0 12 14" fill="none">
<circle cx="3.5" cy="3" r="1.2" fill="currentColor"/>
<circle cx="8.5" cy="3" r="1.2" fill="currentColor"/>
<circle cx="3.5" cy="7" r="1.2" fill="currentColor"/>
<circle cx="8.5" cy="7" r="1.2" fill="currentColor"/>
<circle cx="3.5" cy="11" r="1.2" fill="currentColor"/>
<circle cx="8.5" cy="11" r="1.2" fill="currentColor"/>
</svg>
);

// ── TaskItem Component ─────────────────────────────────────────────────────
function TaskItem({ task, index, onToggle, onDelete, onEdit, onDragStart, onDragOver, onDrop }) {
const [editing, setEditing] = useState(false);
const [editVal, setEditVal] = useState(task.text);
const [deleting, setDeleting] = useState(false);
const editRef = useRef(null);

const startEdit = () => {
setEditing(true);
setTimeout(() => editRef.current?.focus(), 10);
};
const commitEdit = () => {
setEditing(false);
if (editVal.trim() && editVal.trim() !== task.text) onEdit(task.id, editVal.trim());
else setEditVal(task.text);
};

const handleDelete = () => {
setDeleting(true);
setTimeout(() => onDelete(task.id), 210);
};

return (
<div
className={`task-item${task.done ? " done" : ""}${deleting ? " deleting" : ""}`}
draggable
onDragStart={() => onDragStart(index)}
onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
onDrop={onDrop}
>
<span className="drag-handle"><DragIcon /></span>
<span className="task-num">{String(index + 1).padStart(2, "0")}</span>
<button
className={`task-check${task.done ? " checked" : ""}`}
onClick={() => onToggle(task.id)}
aria-label="Toggle task"
>
<span className="checkmark"><CheckIcon /></span>
</button>
<div className="task-body">
{editing ? (
<input
ref={editRef}
className="task-edit-input"
value={editVal}
onChange={(e) => setEditVal(e.target.value)}
onBlur={commitEdit}
onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") { setEditing(false); setEditVal(task.text); } }}
/>
) : (
<div className="task-text" onDoubleClick={startEdit}>{task.text}</div>
)}
</div>
<div className="task-actions">
<button className="icon-btn danger" onClick={handleDelete} aria-label="Delete task">
<TrashIcon />
</button>
</div>
</div>
);
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function App() {
const [allTasks, setAllTasks] = useState(loadTasks);
const [tab, setTab] = useState("today");
const [input, setInput] = useState("");
const [toast, setToast] = useState("");
const [toastVisible, setToastVisible] = useState(false);
const dragSrc = useRef(null);
const inputRef = useRef(null);

const today = todayKey();
const tomorrow = tomorrowKey();
const activeDay = tab === "today" ? today : tomorrow;
const tasks = allTasks[activeDay] || [];

// Persist
useEffect(() => { saveTasks(allTasks); }, [allTasks]);

// Auto carry incomplete tasks from past days
useEffect(() => {
setAllTasks((prev) => {
const updated = { ...prev };
Object.keys(updated).forEach((day) => {
if (day < today) {
const incomplete = (updated[day] || []).filter((t) => !t.done);
if (incomplete.length) {
updated[today] = [
...(updated[today] || []),
...incomplete.map((t) => ({ ...t, id: uid(), carried: true })),
];
updated[day] = updated[day].filter((t) => t.done);
}
}
});
return updated;
});
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

const updateDay = useCallback((day, fn) => {
setAllTasks((prev) => ({ ...prev, [day]: fn(prev[day] || []) }));
}, []);

const addTask = () => {
const text = input.trim();
if (!text) return;
updateDay(activeDay, (t) => [...t, { id: uid(), text, done: false, created: Date.now() }]);
setInput("");
showToast("Goal added ✓");
};

const toggleTask = (id) =>
updateDay(activeDay, (t) =>
t.map((x) => (x.id === id ? { ...x, done: !x.done } : x))
);

const deleteTask = (id) =>
updateDay(activeDay, (t) => t.filter((x) => x.id !== id));

const editTask = (id, text) =>
updateDay(activeDay, (t) =>
t.map((x) => (x.id === id ? { ...x, text } : x))
);

const carryForward = () => {
const incomplete = tasks.filter((t) => !t.done);
if (!incomplete.length) { showToast("No incomplete tasks"); return; }
updateDay(tomorrow, (t) => [
...t,
...incomplete.map((x) => ({ ...x, id: uid(), carried: true })),
]);
showToast(`${incomplete.length} task${incomplete.length > 1 ? "s" : ""} carried →`);
};

// Drag-to-reorder
const handleDragStart = (i) => { dragSrc.current = i; };
const handleDragOver = (i) => {
if (dragSrc.current === null || dragSrc.current === i) return;
updateDay(activeDay, (t) => {
const arr = [...t];
const [item] = arr.splice(dragSrc.current, 1);
arr.splice(i, 0, item);
dragSrc.current = i;
return arr;
});
};
const handleDrop = () => { dragSrc.current = null; };

const showToast = (msg) => {
setToast(msg);
setToastVisible(true);
setTimeout(() => setToastVisible(false), 1800);
};

const done = tasks.filter((t) => t.done).length;
const total = tasks.length;
const pct = total ? Math.round((done / total) * 100) : 0;

const dateLabel = tab === "today"
? new Date().toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })
: new Date(tomorrow + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" });

return (
<div className="app">
{/* Header */}
<div className="header">
<div className="header-meta">DayTracker</div>
<div className="header-title">{tab === "today" ? "Today" : "Tomorrow"}</div>
<div className="header-sub">{dateLabel}</div>
{total > 0 && (
<>
<div className="progress-bar-wrap">
<div className="progress-bar-fill" style={{ width: `${pct}%` }} />
</div>
<div className="progress-label">
<span>{done}/{total} complete</span>
<span>{pct}%</span>
</div>
</>
)}
</div>

{/* Tabs */}  
  <div className="tabs">  
    <button className={`tab-btn${tab === "today" ? " active" : ""}`} onClick={() => setTab("today")}>Today</button>  
    <button className={`tab-btn${tab === "tomorrow" ? " active" : ""}`} onClick={() => setTab("tomorrow")}>Plan Tomorrow</button>  
  </div>  

  {/* Task List */}  
  <div className="task-list">  
    {tasks.length === 0 ? (  
      <div className="empty-state">  
        <div className="empty-icon">{tab === "today" ? "◎" : "◇"}</div>  
        <div className="empty-title">No goals yet.</div>  
        <div className="empty-sub">  
          {tab === "today"  
            ? "Plan your next win.\nAdd your first goal below."  
            : "Set tomorrow's intentions.\nBe specific, be real."}  
        </div>  
      </div>  
    ) : (  
      tasks.map((task, i) => (  
        <TaskItem  
          key={task.id}  
          task={task}  
          index={i}  
          onToggle={toggleTask}  
          onDelete={deleteTask}  
          onEdit={editTask}  
          onDragStart={handleDragStart}  
          onDragOver={handleDragOver}  
          onDrop={handleDrop}  
        />  
      ))  
    )}  
  </div>  

  {/* Input */}  
  <div className="input-area">  
    <div className="input-row">  
      <input  
        ref={inputRef}  
        className="task-input"  
        value={input}  
        onChange={(e) => setInput(e.target.value)}  
        onKeyDown={(e) => e.key === "Enter" && addTask()}  
        placeholder={tab === "today" ? "Add today's goal…" : "Plan tomorrow's goal…"}  
        maxLength={120}  
      />  
      <button className="add-btn" onClick={addTask} disabled={!input.trim()} aria-label="Add task">  
        +  
      </button>  
    </div>  
    <div className="input-hint">  
      <span>double-tap to edit · drag to reorder</span>  
      {tab === "today" && tasks.filter((t) => !t.done).length > 0 && (  
        <button className="carry-btn" onClick={carryForward}>carry forward →</button>  
      )}  
    </div>  
  </div>  

  {/* Toast */}  
  <div className={`toast${toastVisible ? " show" : ""}`}>{toast}</div>  
</div>

);
                       }
