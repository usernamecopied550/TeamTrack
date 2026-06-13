import { useState } from "react";
import "./App.css";

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit() {
    if (isRegistering) {
      try {
        const response = await fetch("http://localhost:5234/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        setMessage(data.message);
        setIsRegistering(false);
      } catch {
        setMessage("Server error");
      }
    } else {
      try {
        const response = await fetch("http://localhost:5234/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (response.ok) {
          setIsLoggedIn(true);
        } else {
          const data = await response.json();
          setMessage(data.message);
        }
      } catch {
        setMessage("Server error");
      }
    }
  }

  if (isLoggedIn) return <Dashboard />;

  return (
    <main className="app">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Team Track</p>
          <h1>Student project collaboration system</h1>
          <p>A React frontend connected to an ASP.NET Core API and MySQL database.</p>
        </div>
        <form className="login-form">
          <h2>{isRegistering ? "Register" : "Login"}</h2>
          {isRegistering && (
            <label>Full name<input type="text" placeholder="Your name" /></label>
          )}
          <label>
            Email
            <input type="email" placeholder="student@teamtrack.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            Password
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {isRegistering && (
            <label>Confirm password<input type="password" placeholder="Confirm password" /></label>
          )}
          <button type="button" onClick={handleSubmit}>
            {isRegistering ? "Create account" : "Log in"}
          </button>
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

function Dashboard() {
  const [activePage, setActivePage] = useState("dashboard");

  const [projects, setProjects] = useState([
    { name: "Web Engineering Project", deadline: "18 June 2026", members: ["Rania", "Cindy", "Omar"], status: "Active", progress: 70 },
    { name: "Database Lab", deadline: "24 June 2026", members: ["Lina", "Adam", "Sofia"], status: "Active", progress: 45 },
    { name: "Research Methods", deadline: "10 June 2026", members: ["Rania", "Lina"], status: "Review", progress: 88 },
  ]);

  const [tasks, setTasks] = useState([
    { title: "Create login validation", assignedTo: "Rania", status: "todo", priority: "High" },
    { title: "Prepare MySQL schema", assignedTo: "Cindy", status: "todo", priority: "Medium" },
    { title: "Build ASP.NET Core auth API", assignedTo: "Omar", status: "in-progress", priority: "High" },
    { title: "Draft component architecture", assignedTo: "Rania", status: "completed", priority: "Low" },
  ]);

  const [chatMessages, setChatMessages] = useState([
    { sender: "Rania", text: "I created the project group and added the first tasks.", own: false },
    { sender: "Cindy", text: "I started the MySQL database schema.", own: false },
    { sender: "You", text: "I will connect the React frontend to the ASP.NET Core API.", own: true },
  ]);

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [newMemberName, setNewMemberName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPerson, setNewTaskPerson] = useState("Rania");
  const [newMessage, setNewMessage] = useState("");

  const allMembers = [...new Set(projects.flatMap((p) => p.members))];
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const inProgressTasks = tasks.filter((t) => t.status === "in-progress");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  async function addProject() {
    if (newProjectName.trim() === "") return;
    try {
      await fetch("http://localhost:5234/api/project/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: newProjectDeadline }),
      });
    } catch { console.error("Error creating project"); }
    setProjects([...projects, { name: newProjectName, deadline: newProjectDeadline || "No deadline yet", members: ["Rania"], status: "Active", progress: 0 }]);
    setNewProjectName("");
    setNewProjectDeadline("");
  }

  function addMember() {
    if (newMemberName.trim() === "") return;
    setProjects(projects.map((project, index) =>
      index === Number(selectedProjectIndex) ? { ...project, members: [...project.members, newMemberName] } : project
    ));
    setNewMemberName("");
  }

  function addTask() {
    if (newTaskTitle.trim() === "") return;
    setTasks([...tasks, { title: newTaskTitle, assignedTo: newTaskPerson, status: "todo", priority: "Medium" }]);
    setNewTaskTitle("");
  }

  function sendMessage() {
    if (newMessage.trim() === "") return;
    setChatMessages([...chatMessages, { sender: "You", text: newMessage, own: true }]);
    setNewMessage("");
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-icon">🎯</span>
          <span className="logo-text">TeamTrack</span>
        </div>
        <nav className="sidebar-nav">
          {[
            { id: "dashboard", label: "Dashboard", icon: "📊" },
            { id: "projects", label: "Projects", icon: "📁" },
            { id: "tasks", label: "Tasks", icon: "✅" },
            { id: "members", label: "Members", icon: "👥" },
            { id: "chat", label: "Chat", icon: "💬" },
          ].map((item) => (
            <button key={item.id} className={`nav-item ${activePage === item.id ? "active" : ""}`} onClick={() => setActivePage(item.id)}>
              <span>{item.icon}</span><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="dashboard-content">

        {activePage === "dashboard" && (
          <div className="page">
            <h1 className="page-title">Dashboard</h1>
            <div className="stats-row">
              <div className="stat-card"><p className="stat-number">{projects.length}</p><p className="stat-label">Projects</p></div>
              <div className="stat-card"><p className="stat-number">{tasks.length}</p><p className="stat-label">Total Tasks</p></div>
              <div className="stat-card"><p className="stat-number">{inProgressTasks.length}</p><p className="stat-label">In Progress</p></div>
              <div className="stat-card"><p className="stat-number">{completedTasks.length}</p><p className="stat-label">Completed</p></div>
            </div>
            <h2 className="section-title">Recent Projects</h2>
            <div className="project-list">
              {projects.map((project, i) => (
                <div key={i} className="project-card">
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <span className={`status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
                  </div>
                  <p className="project-deadline">📅 {project.deadline}</p>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${project.progress}%` }}></div></div>
                  <p className="progress-label">{project.progress}% complete</p>
                  <div className="member-chips">{project.members.map((m, j) => <span key={j} className="chip">{m}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === "projects" && (
          <div className="page">
            <h1 className="page-title">Projects</h1>
            <div className="form-card">
              <h2>Add New Project</h2>
              <div className="form-row">
                <input type="text" placeholder="Project name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} />
                <input type="text" placeholder="Deadline (e.g. 30 June 2026)" value={newProjectDeadline} onChange={(e) => setNewProjectDeadline(e.target.value)} />
                <button onClick={addProject}>Add Project</button>
              </div>
            </div>
            <div className="project-list">
              {projects.map((project, i) => (
                <div key={i} className="project-card">
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <span className={`status-badge ${project.status.toLowerCase()}`}>{project.status}</span>
                  </div>
                  <p className="project-deadline">📅 {project.deadline}</p>
                  <div className="progress-bar"><div className="progress-fill" style={{ width: `${project.progress}%` }}></div></div>
                  <p className="progress-label">{project.progress}% complete</p>
                  <div className="member-chips">{project.members.map((m, j) => <span key={j} className="chip">{m}</span>)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === "tasks" && (
          <div className="page">
            <h1 className="page-title">Tasks</h1>
            <div className="form-card">
              <h2>Add New Task</h2>
              <div className="form-row">
                <input type="text" placeholder="Task title" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} />
                <select value={newTaskPerson} onChange={(e) => setNewTaskPerson(e.target.value)}>
                  {allMembers.map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
                <button onClick={addTask}>Add Task</button>
              </div>
            </div>
            <div className="kanban">
              <div className="kanban-col">
                <h3 className="kanban-heading todo">To Do ({todoTasks.length})</h3>
                {todoTasks.map((t, i) => (
                  <div key={i} className="task-card">
                    <p className="task-title">{t.title}</p>
                    <div className="task-meta">
                      <span className="chip">{t.assignedTo}</span>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="kanban-col">
                <h3 className="kanban-heading in-progress">In Progress ({inProgressTasks.length})</h3>
                {inProgressTasks.map((t, i) => (
                  <div key={i} className="task-card">
                    <p className="task-title">{t.title}</p>
                    <div className="task-meta">
                      <span className="chip">{t.assignedTo}</span>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="kanban-col">
                <h3 className="kanban-heading completed">Completed ({completedTasks.length})</h3>
                {completedTasks.map((t, i) => (
                  <div key={i} className="task-card">
                    <p className="task-title">{t.title}</p>
                    <div className="task-meta">
                      <span className="chip">{t.assignedTo}</span>
                      <span className={`priority-badge ${t.priority.toLowerCase()}`}>{t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePage === "members" && (
          <div className="page">
            <h1 className="page-title">Members</h1>
            <div className="form-card">
              <h2>Add Member to Project</h2>
              <div className="form-row">
                <select value={selectedProjectIndex} onChange={(e) => setSelectedProjectIndex(e.target.value)}>
                  {projects.map((p, i) => <option key={i} value={i}>{p.name}</option>)}
                </select>
                <input type="text" placeholder="Member name" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} />
                <button onClick={addMember}>Add Member</button>
              </div>
            </div>
            <div className="member-grid">
              {allMembers.map((member, i) => (
                <div key={i} className="member-card">
                  <div className="member-avatar">{member[0]}</div>
                  <p className="member-name">{member}</p>
                  <p className="member-projects">{projects.filter((p) => p.members.includes(member)).length} project(s)</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activePage === "chat" && (
          <div className="page chat-page">
            <h1 className="page-title">Team Chat</h1>
            <div className="chat-box">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`chat-message ${msg.own ? "own" : "other"}`}>
                  {!msg.own && <p className="chat-sender">{msg.sender}</p>}
                  <div className="chat-bubble">{msg.text}</div>
                </div>
              ))}
            </div>
            <div className="chat-input-row">
              <input type="text" placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default App;