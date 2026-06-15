import { useState, useEffect } from "react";
import "./App.css";

const API = "http://localhost:5234/api";

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit() {
    setMessage("");
    if (isRegistering) {
      try {
        const res = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();
        if (res.ok) { setMessage("Registered! Please log in."); setIsRegistering(false); }
        else setMessage(data.message);
      } catch { setMessage("Server error — is your backend running?"); }
    } else {
      try {
        const res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (res.ok) setUser(data);
        else setMessage(data.message);
      } catch { setMessage("Server error — is your backend running?"); }
    }
  }

  if (user) return <Dashboard user={user} onLogout={() => setUser(null)} />;

  return (
    <main className="app">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Team Track</p>
          <h1>Student project collaboration system</h1>
          <p>A React frontend connected to an ASP.NET Core API and MySQL database.</p>
        </div>
        <form className="login-form">
          <h2>{isRegistering ? "Create account" : "Welcome back"}</h2>
          {isRegistering && (
            <label>Full name<input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} /></label>
          )}
          <label>Email<input type="email" placeholder="student@teamtrack.edu" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <label>Password<input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {isRegistering && (
            <label>Confirm password<input type="password" placeholder="Confirm password" /></label>
          )}
          <button type="button" onClick={handleSubmit}>{isRegistering ? "Create account" : "Log in"}</button>
          {message && <p className="success-message">{message}</p>}
          <p className="switch-text">
            {isRegistering ? "Already have an account?" : "Need an account?"}{" "}
            <button type="button" onClick={() => { setIsRegistering(!isRegistering); setMessage(""); }}>
              {isRegistering ? "Login" : "Register"}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}

function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => { loadProjects(); loadNotifications(); }, []);

  async function loadProjects() {
    try {
      const res = await fetch(`${API}/project/list/${user.userId}`);
      const data = await res.json();
      setProjects(data);
      if (data.length > 0) setSelectedProject(prev => prev ? data.find(p => p.id === prev.id) || data[0] : data[0]);
    } catch { console.error("Could not load projects"); }
  }

  async function loadNotifications() {
    try {
      const res = await fetch(`${API}/project/notifications/${user.userId}`);
      const data = await res.json();
      setNotifications(data);
    } catch {}
  }

  async function markAllRead() {
    await fetch(`${API}/project/notifications/markread/${user.userId}`, { method: "POST" });
    loadNotifications();
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const userInitial = ((user.name || user.email) || "U")[0].toUpperCase();
  const displayName = user.name || user.email || "User";

  function selectProject(project) {
    setSelectedProject(project);
    setActivePage("tasks");
  }

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "projects", label: "Projects", icon: "📁" },
    { id: "tasks", label: "Tasks", icon: "✅" },
    { id: "members", label: "Members", icon: "👥" },
    { id: "chat", label: "Chat", icon: "💬" },
    { id: "profile", label: "My Profile", icon: "👤" },
    ...(user.isAdmin ? [{ id: "admin", label: "Super Admin Panel", icon: "⚙️" }] : []),
  ];

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🎯</span>
          <span className="logo-text">TeamTrack</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button key={item.id} className={`nav-item ${activePage === item.id ? "active" : ""}`} onClick={() => setActivePage(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="user-avatar">{userInitial}</div>
          <div style={{ flex: 1 }}>
            <p className="user-name">{displayName}</p>
            <p className="user-email">{user.email || ""}</p>
          </div>
          <button onClick={onLogout} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", fontSize: "18px", width: "32px", height: "32px", borderRadius: "8px", cursor: "pointer", flexShrink: 0 }} title="Log out">⏻</button>
        </div>
      </aside>

      <div className="dashboard-content">
        <div className="notif-bar">
          <button className="notif-bell" onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}>
            🔔 {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>
          {showNotifs && (
            <div className="notif-dropdown">
              <h3>Notifications</h3>
              {notifications.length === 0 && <p className="notif-empty">No notifications yet</p>}
              {notifications.map(n => (
                <div key={n.id} className={`notif-item ${n.isRead ? "read" : "unread"}`}>
                  <p>{n.message}</p>
                  <span>{n.createdAt}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {activePage === "dashboard" && <DashboardHome projects={projects} user={user} onSelectProject={selectProject} setActivePage={setActivePage} />}
        {activePage === "projects" && <ProjectsPage projects={projects} user={user} onProjectCreated={loadProjects} onSelectProject={selectProject} />}
        {activePage === "tasks" && <TasksPage projects={projects} user={user} selectedProject={selectedProject} setSelectedProject={setSelectedProject} onProgressUpdate={loadProjects} />}
        {activePage === "members" && <MembersPage projects={projects} user={user} />}
        {activePage === "chat" && <ChatPage projects={projects} user={user} selectedProject={selectedProject} setSelectedProject={setSelectedProject} />}
        {activePage === "profile" && <ProfilePage user={user} projects={projects} />}
        {activePage === "admin" && user.isAdmin && <AdminPage user={user} />}
      </div>
    </main>
  );
}

function DashboardHome({ projects, user, onSelectProject, setActivePage }) {
  const displayName = user.name || user.email || "User";
  return (
    <div className="page">
      <h1 className="page-title">Welcome back, {displayName} 👋</h1>
      <div className="stats-row">
        <div className="stat-card"><p className="stat-number">{projects.length}</p><p className="stat-label">Projects</p></div>
        <div className="stat-card"><p className="stat-number">{projects.filter(p => p.isAdmin).length}</p><p className="stat-label">You Admin</p></div>
        <div className="stat-card">
          <p className="stat-number">{projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0}%</p>
          <p className="stat-label">Avg Progress</p>
        </div>
        <div className="stat-card"><p className="stat-number">{projects.filter(p => p.progress === 100).length}</p><p className="stat-label">Completed</p></div>
      </div>
      <h2 className="section-title">Your Projects</h2>
      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet.</p>
          <button onClick={() => setActivePage("projects")}>Create your first project →</button>
        </div>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-card" onClick={() => onSelectProject(project)} style={{ cursor: "pointer" }}>
              <div className="project-card-header">
                <h3>{project.name}</h3>
                {project.isAdmin ? <span className="admin-badge">Project Admin</span> : <span className="status-badge member">Member</span>}
              </div>
              <p className="project-deadline">📅 {project.deadline || "No deadline"}</p>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${project.progress}%` }}></div></div>
              <p className="progress-label">{project.progress}% complete</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectsPage({ projects, user, onProjectCreated, onSelectProject }) {
  const [newName, setNewName] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [msg, setMsg] = useState("");
  const [editingProject, setEditingProject] = useState(null);

  async function createProject() {
    if (!newName.trim()) return;
    try {
      const res = await fetch(`${API}/project/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName, description: newDesc, deadline: newDeadline, adminId: user.userId }),
      });
      const data = await res.json();
      setMsg(data.message);
      setNewName(""); setNewDeadline(""); setNewDesc("");
      onProjectCreated();
    } catch { setMsg("Error creating project"); }
  }

  async function deleteProject(projectId) {
    if (!window.confirm("Delete this project and all its data? This cannot be undone.")) return;
    try {
      const res = await fetch(`${API}/project/delete/${projectId}/${user.userId}`, { method: "DELETE" });
      const data = await res.json();
      setMsg(data.message);
      onProjectCreated();
    } catch { setMsg("Error deleting project"); }
  }

  async function saveEditProject() {
    if (!editingProject.name.trim()) return;
    try {
      const res = await fetch(`${API}/project/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: editingProject.id,
          requesterId: user.userId,
          name: editingProject.name,
          description: editingProject.description || "",
          deadline: editingProject.deadline || ""
        }),
      });
      const data = await res.json();
      setMsg(data.message);
      setEditingProject(null);
      onProjectCreated();
    } catch { setMsg("Error updating project"); }
  }

  return (
    <div className="page">
      <h1 className="page-title">Projects</h1>

      {!user.isAdmin ? (
        <div className="form-card">
          <h2>Create New Project</h2>
          <div className="form-row">
            <input type="text" placeholder="Project name" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <input type="text" placeholder="Deadline (e.g. 30 June 2026)" value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)} />
            <input type="text" placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <button onClick={createProject}>Create</button>
          </div>
          {msg && <p className="success-message">{msg}</p>}
        </div>
      ) : (
        <div className="form-card" style={{ background: "#fdf0f8", border: "1px solid #f3d4ff" }}>
          <p style={{ color: "#b08fd4", fontSize: "14px" }}>👁️ You are viewing as Super Admin — you can monitor all projects but cannot create new ones.</p>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Project</h2>
            <div className="form-row" style={{ flexDirection: "column" }}>
              <input
                type="text"
                placeholder="Project name"
                value={editingProject.name}
                onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
              />
              <input
                type="text"
                placeholder="Deadline (e.g. 30 June 2026)"
                value={editingProject.deadline || ""}
                onChange={(e) => setEditingProject({ ...editingProject, deadline: e.target.value })}
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={editingProject.description || ""}
                onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
              />
            </div>
            <div className="modal-btns">
              <button onClick={saveEditProject}>Save</button>
              <button className="cancel-btn" onClick={() => setEditingProject(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="empty-state"><p>No projects yet — create one above!</p></div>
      ) : (
        <div className="project-list">
          {projects.map((project) => (
            <div key={project.id} className="project-card">
              <div className="project-card-header" onClick={() => onSelectProject(project)} style={{ cursor: "pointer" }}>
                <h3>{project.name}</h3>
                {project.isAdmin ? <span className="admin-badge">Project Admin</span> : <span className="status-badge member">Member</span>}
              </div>
              {project.description && <p className="project-deadline">{project.description}</p>}
              <p className="project-deadline">📅 {project.deadline || "No deadline"}</p>
              <div className="progress-bar"><div className="progress-fill" style={{ width: `${project.progress}%` }}></div></div>
              <p className="progress-label">{project.progress}% complete</p>
              {project.isAdmin && !user.isAdmin && (
                <div className="task-admin-btns">
                  <button className="edit-btn" onClick={() => setEditingProject({ ...project })}>✏️ Edit</button>
                  <button className="delete-btn" onClick={() => deleteProject(project.id)}>🗑️ Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TasksPage({ projects, user, selectedProject, setSelectedProject, onProgressUpdate }) {
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPerson, setNewTaskPerson] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [editingTask, setEditingTask] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => { if (selectedProject) { loadTasks(); loadMembers(); } }, [selectedProject]);

  async function loadTasks() {
    const res = await fetch(`${API}/project/${selectedProject.id}/tasks`);
    const data = await res.json();
    setTasks(data);
  }

  async function loadMembers() {
    const res = await fetch(`${API}/project/${selectedProject.id}/members`);
    const data = await res.json();
    setMembers(data);
    if (data.length > 0) setNewTaskPerson(data[0].id);
  }

  async function addTask() {
    if (!newTaskTitle.trim()) return;
    const res = await fetch(`${API}/project/addtask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject.id, requesterId: user.userId, title: newTaskTitle, assignedToId: parseInt(newTaskPerson), priority: newTaskPriority }),
    });
    const data = await res.json();
    setMsg(data.message);
    setNewTaskTitle("");
    loadTasks();
  }

  async function updateStatus(taskId, status) {
    await fetch(`${API}/project/updatetask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, projectId: selectedProject.id, status }),
    });
    loadTasks();
    if (onProgressUpdate) onProgressUpdate();
  }

  async function deleteTask(taskId) {
    if (!window.confirm("Delete this task?")) return;
    await fetch(`${API}/project/deletetask/${taskId}/${selectedProject.id}/${user.userId}`, { method: "DELETE" });
    loadTasks();
    if (onProgressUpdate) onProgressUpdate();
  }

  async function saveEditTask() {
    if (!editingTask.title.trim()) return;
    await fetch(`${API}/project/updatetaskdetails`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: editingTask.id, projectId: selectedProject.id, requesterId: user.userId, title: editingTask.title, assignedToId: editingTask.assignedToId, priority: editingTask.priority }),
    });
    setEditingTask(null);
    loadTasks();
  }

  const todo = tasks.filter(t => t.status === "todo");
  const inProgress = tasks.filter(t => t.status === "in-progress");
  const completed = tasks.filter(t => t.status === "completed");

  if (!selectedProject) return (
    <div className="page">
      <h1 className="page-title">Tasks</h1>
      <div className="empty-state"><p>No project selected. Create a project first!</p></div>
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Tasks</h1>
      <div className="project-selector">
        <label>Project:</label>
        <select value={selectedProject?.id || ""} onChange={(e) => setSelectedProject(projects.find(p => p.id === parseInt(e.target.value)))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {selectedProject?.isAdmin && !user.isAdmin && (
        <div className="form-card">
          <h2>Assign New Task <span className="admin-only-label">(Project Admin only)</span></h2>
          <div className="form-row">
            <input type="text" placeholder="Task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
            <select value={newTaskPerson} onChange={(e) => setNewTaskPerson(e.target.value)}>
              {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
            </select>
            <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)}>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button onClick={addTask}>Add Task</button>
          </div>
          {msg && <p className="success-message">{msg}</p>}
        </div>
      )}
      {editingTask && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Task</h2>
            <div className="form-row" style={{ flexDirection: "column" }}>
              <input type="text" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} placeholder="Task title" />
              <select value={editingTask.assignedToId} onChange={(e) => setEditingTask({ ...editingTask, assignedToId: parseInt(e.target.value) })}>
                {members.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
              </select>
              <select value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value })}>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="modal-btns">
              <button onClick={saveEditTask}>Save</button>
              <button className="cancel-btn" onClick={() => setEditingTask(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="kanban">
        {[["todo", "To Do", todo], ["in-progress", "In Progress", inProgress], ["completed", "Completed", completed]].map(([status, label, list]) => (
          <div key={status} className="kanban-col">
            <h3 className={`kanban-heading ${status}`}>{label} ({list.length})</h3>
            {list.map(t => (
              <div key={t.id} className="task-card">
                <p className="task-title">{t.title}</p>
                <div className="task-meta">
                  <span className="chip">{t.assignedTo}</span>
                  <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                </div>
                <select
                  className="status-select"
                  value={t.status}
                  onChange={(e) => updateStatus(t.id, e.target.value)}
                  disabled={user.isAdmin || (!selectedProject?.isAdmin && t.assignedTo !== (user.name || user.email))}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
                {selectedProject?.isAdmin && !user.isAdmin && (
                  <div className="task-admin-btns">
                    <button className="edit-btn" onClick={() => setEditingTask({ id: t.id, title: t.title, assignedToId: members.find(m => (m.name || m.email) === t.assignedTo)?.id || members[0]?.id, priority: t.priority })}>✏️ Edit</button>
                    <button className="delete-btn" onClick={() => deleteTask(t.id)}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function MembersPage({ projects, user }) {
  const [selectedProject, setSelectedProject] = useState(projects[0] || null);
  const [members, setMembers] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [msg, setMsg] = useState("");

  useEffect(() => { if (selectedProject) loadMembers(); }, [selectedProject]);

  async function loadMembers() {
    const res = await fetch(`${API}/project/${selectedProject.id}/members`);
    const data = await res.json();
    setMembers(data);
  }

  async function addMember() {
    if (!newEmail.trim()) return;
    const res = await fetch(`${API}/project/addmember`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject.id, requesterId: user.userId, memberEmail: newEmail }),
    });
    const data = await res.json();
    setMsg(data.message);
    setNewEmail("");
    loadMembers();
  }

  async function removeMember(memberId) {
    if (!window.confirm("Remove this member from the project?")) return;
    const res = await fetch(`${API}/project/${selectedProject.id}/removemember/${memberId}/${user.userId}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(data.message);
    loadMembers();
  }

  if (!selectedProject) return (
    <div className="page">
      <h1 className="page-title">Members</h1>
      <div className="empty-state"><p>No project selected. Create a project first!</p></div>
    </div>
  );

  return (
    <div className="page">
      <h1 className="page-title">Members</h1>
      <div className="project-selector">
        <label>Project:</label>
        <select value={selectedProject?.id || ""} onChange={(e) => setSelectedProject(projects.find(p => p.id === parseInt(e.target.value)))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      {selectedProject?.isAdmin && !user.isAdmin && (
        <div className="form-card">
          <h2>Add Member <span className="admin-only-label">(Project Admin only)</span></h2>
          <div className="form-row">
            <input type="email" placeholder="Member's email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            <button onClick={addMember}>Add Member</button>
          </div>
          {msg && <p className="success-message">{msg}</p>}
        </div>
      )}
      {user.isAdmin && (
        <div className="form-card" style={{ background: "#fdf0f8", border: "1px solid #f3d4ff" }}>
          <p style={{ color: "#b08fd4", fontSize: "14px" }}>👁️ Super Admin view — you can see all members but cannot add or remove them.</p>
        </div>
      )}
      <div className="member-grid">
        {members.map((m) => (
          <div key={m.id} className="member-card">
            <div className="member-avatar">{((m.name || m.email) || "U")[0].toUpperCase()}</div>
            <p className="member-name">{m.name || "No name"}</p>
            <p className="member-projects">{m.email}</p>
            {selectedProject?.adminId === m.id
              ? <span className="admin-badge">Project Admin</span>
              : selectedProject?.isAdmin && !user.isAdmin
                ? <button className="delete-btn" style={{ marginTop: "8px" }} onClick={() => removeMember(m.id)}>Remove</button>
                : null
            }
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatPage({ projects, user, selectedProject, setSelectedProject }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => { if (selectedProject) loadMessages(); }, [selectedProject]);

  async function loadMessages() {
    const res = await fetch(`${API}/project/${selectedProject.id}/messages`);
    const data = await res.json();
    setMessages(data);
  }

  async function sendMessage() {
    if (!newMessage.trim()) return;
    await fetch(`${API}/project/sendmessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: selectedProject.id, userId: user.userId, text: newMessage }),
    });
    setNewMessage("");
    loadMessages();
  }

  if (!selectedProject) return (
    <div className="page">
      <h1 className="page-title">Team Chat</h1>
      <div className="empty-state"><p>No project selected. Create a project first!</p></div>
    </div>
  );

  return (
    <div className="page chat-page">
      <h1 className="page-title">Team Chat</h1>
      <div className="project-selector">
        <label>Project:</label>
        <select value={selectedProject?.id || ""} onChange={(e) => setSelectedProject(projects.find(p => p.id === parseInt(e.target.value)))}>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div className="chat-box">
        {messages.length === 0 && <p style={{ color: "#b08fd4", textAlign: "center", marginTop: "20px" }}>No messages yet — say hello! 👋</p>}
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.userId === user.userId ? "own" : "other"}`}>
            {msg.userId !== user.userId && <p className="chat-sender">{msg.sender}</p>}
            <div className="chat-bubble">{msg.text}</div>
            <p className="chat-time">{msg.sentAt}</p>
          </div>
        ))}
      </div>
      {!user.isAdmin ? (
        <div className="chat-input-row">
          <input type="text" placeholder="Type a message..." value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
          <button onClick={sendMessage}>Send</button>
        </div>
      ) : (
        <div className="form-card" style={{ background: "#fdf0f8", border: "1px solid #f3d4ff", padding: "12px 16px" }}>
          <p style={{ color: "#b08fd4", fontSize: "13px" }}>👁️ Super Admin view only — you can read messages but cannot send.</p>
        </div>
      )}
    </div>
  );
}

function AdminPage({ user }) {
  const [users, setUsers] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [activeTab, setActiveTab] = useState("users");
  const [msg, setMsg] = useState("");

  useEffect(() => { loadUsers(); loadAllProjects(); }, []);

  async function loadUsers() {
    try {
      const res = await fetch(`${API}/project/admin/users/${user.userId}`);
      const data = await res.json();
      setUsers(data);
    } catch {}
  }

  async function loadAllProjects() {
    try {
      const res = await fetch(`${API}/project/admin/projects/${user.userId}`);
      const data = await res.json();
      setAllProjects(data);
    } catch {}
  }

  async function deleteUser(targetId) {
    if (!window.confirm("Delete this user?")) return;
    const res = await fetch(`${API}/project/admin/users/${user.userId}/${targetId}`, { method: "DELETE" });
    const data = await res.json();
    setMsg(data.message);
    loadUsers();
  }

  return (
    <div className="page">
      <h1 className="page-title">⚙️ Super Admin Panel</h1>
      <p style={{ color: "#b08fd4", fontSize: "13px", marginTop: "-16px" }}>Full website control — manage all users and projects</p>
      {msg && <p className="success-message">{msg}</p>}
      <div className="admin-tabs">
        <button className={activeTab === "users" ? "active" : ""} onClick={() => setActiveTab("users")}>👥 All Users ({users.length})</button>
        <button className={activeTab === "projects" ? "active" : ""} onClick={() => setActiveTab("projects")}>📁 All Projects ({allProjects.length})</button>
      </div>
      {activeTab === "users" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name || "—"}</td>
                  <td>{u.email}</td>
                  <td>{u.isAdmin ? <span className="admin-badge">Super Admin</span> : "User"}</td>
                  <td>{u.id !== user.userId && <button className="delete-btn" onClick={() => deleteUser(u.id)}>Delete</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {activeTab === "projects" && (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead><tr><th>ID</th><th>Name</th><th>Project Admin</th><th>Members</th><th>Tasks</th><th>Progress</th><th>Deadline</th></tr></thead>
            <tbody>
              {allProjects.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.adminName}</td>
                  <td>{p.memberCount}</td>
                  <td>{p.taskCount}</td>
                  <td>
                    <div className="progress-bar" style={{ width: "80px" }}>
                      <div className="progress-fill" style={{ width: `${p.progress}%` }}></div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#b08fd4" }}>{p.progress}%</span>
                  </td>
                  <td>{p.deadline || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProfilePage({ user, projects }) {
  const [name, setName] = useState(user.name || "");
  const [bio, setBio] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");
  const [passMsg, setPassMsg] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch(`${API}/auth/profile/${user.userId}`);
        const data = await res.json();
        setName(data.name || "");
        setBio(data.bio || "");
      } catch {}
    }
    loadProfile();
  }, []);

  async function saveProfile() {
    const res = await fetch(`${API}/auth/updateprofile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.userId, name, bio }),
    });
    const data = await res.json();
    setProfileMsg(data.message);
    setTimeout(() => setProfileMsg(""), 3000);
  }

 async function changePassword() {
    if (newPassword !== confirmPassword) { setPassMsg("New passwords do not match"); return; }
    if (newPassword.length < 4) { setPassMsg("Password must be at least 4 characters"); return; }
    try {
      const res = await fetch(`${API}/auth/changepassword`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.userId, oldPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      setPassMsg(data.message);
      if (res.ok) { setOldPassword(""); setNewPassword(""); setConfirmPassword(""); }
    } catch {
      setPassMsg("Server error — please try again");
    }
  }

  const userInitial = ((name || user.email) || "U")[0].toUpperCase();
  const avgProgress = projects.length > 0 ? Math.round(projects.reduce((a, p) => a + p.progress, 0) / projects.length) : 0;

  return (
    <div className="page profile-page">
      <h1 className="page-title">My Profile</h1>

      <div className="profile-header-card">
        <div className="profile-avatar-large">{userInitial}</div>
        <div className="profile-header-info">
          <h2>{name || "No name set"}</h2>
          <p>{user.email}</p>
          {bio && <p style={{ marginTop: "6px", fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>{bio}</p>}
          <span className="profile-role">{user.isAdmin ? "⚙️ Super Admin" : "👤 User"}</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat"><p className="stat-number">{projects.length}</p><p className="stat-label">Total Projects</p></div>
        <div className="profile-stat"><p className="stat-number">{projects.filter(p => p.isAdmin).length}</p><p className="stat-label">Projects as Admin</p></div>
        <div className="profile-stat"><p className="stat-number">{avgProgress}%</p><p className="stat-label">Avg Progress</p></div>
      </div>

      <div className="profile-form-card">
        <h2>✏️ Edit Profile</h2>
        <div className="profile-field">
          <label>Full Name</label>
          <input type="text" placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="profile-field">
          <label>Email</label>
          <input type="email" value={user.email} disabled style={{ opacity: 0.6, cursor: "not-allowed" }} />
        </div>
        <div className="profile-field">
          <label>Bio</label>
          <textarea placeholder="Tell your team a bit about yourself..." value={bio} onChange={(e) => setBio(e.target.value)} />
        </div>
        {profileMsg && <p className="success-message">{profileMsg}</p>}
        <button className="profile-save-btn" onClick={saveProfile}>Save Changes</button>
      </div>

      <div className="profile-form-card password-section">
        <h2>🔒 Change Password</h2>
        <div className="profile-field">
          <label>Current Password</label>
          <input type="password" placeholder="Enter current password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div className="profile-field">
          <label>New Password</label>
          <input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <div className="profile-field">
          <label>Confirm New Password</label>
          <input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        {passMsg && <p className="success-message">{passMsg}</p>}
        <button className="profile-save-btn" onClick={changePassword}>Change Password</button>
      </div>
    </div>
  );
}

export default App;