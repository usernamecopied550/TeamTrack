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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    });

    const data = await response.json();
    setMessage(data.message);
    setIsRegistering(false);
  } catch (error) {
    setMessage("Server error");
  }
}
  else {
    try {
      const response = await fetch("http://localhost:5234/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
  email: email,
  password: password,
}),
      });

      if (response.ok) {
        setIsLoggedIn(true);
      } else {
        const data = await response.json();
        setMessage(data.message);
      }
    } catch (error) {
      console.error(error);
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
            <label>
              Full name
              <input type="text" placeholder="Your name" />
            </label>
          )}

          <label>
            Email
            <input
  type="email"
  placeholder="student@teamtrack.edu"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
          </label>

          <label>
            Password
           <input
  type="password"
  placeholder="Password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
/>
          </label>

          {isRegistering && (
            <label>
              Confirm password
              <input type="password" placeholder="Confirm password" />
            </label>
          )}

          <button type="button" onClick={handleSubmit}>
            {isRegistering ? "Create account" : "Log in"}
          </button>

          {message && <p className="success-message">{message}</p>}

          <p className="switch-text">
            {isRegistering ? "Already have an account?" : "Need an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMessage("");
              }}
            >
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
    {
      name: "Web Engineering Project",
      deadline: "18 June 2026",
      members: ["Rania", "Cindy", "Omar"],
      status: "Active",
      progress: 70,
    },
    {
      name: "Database Lab",
      deadline: "24 June 2026",
      members: ["Lina", "Adam", "Sofia"],
      status: "Active",
      progress: 45,
    },
    {
      name: "Research Methods",
      deadline: "10 June 2026",
      members: ["Rania", "Lina"],
      status: "Review",
      progress: 88,
    },
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

  const allMembers = [...new Set(projects.flatMap((project) => project.members))];
async function addProject() {
  if (newProjectName.trim() === "") return;

  try {
    const response = await fetch("http://localhost:5234/api/project/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: newProjectName,
        description: newProjectDeadline,
      }),
    });

    const data = await response.json();
    console.log(data.message);

    // ALSO update UI (keep your old behavior)
    setProjects([
      ...projects,
      {
        name: newProjectName,
        deadline: newProjectDeadline || "No deadline yet",
        members: ["Rania"],
        status: "Active",
        progress: 0,
      },
    ]);

    setNewProjectName("");
    setNewProjectDeadline("");
  } catch (error) {
    console.error("Error creating project");
  }
}

    setNewProjectName("");
    setNewProjectDeadline("");
  }

  function addMember() {
    if (newMemberName.trim() === "") return;

    setProjects(
      projects.map((project, index) =>
        index === Number(selectedProjectIndex)
          ? { ...project, members: [...project.members, newMemberName] }
          : project
      )
    );

    setNewMemberName("");
  }

  function addTask() {
    if (newTaskTitle.trim() === "") return;

    setTasks([
      ...tasks,
      {
        title: newTaskTitle,
        assignedTo: newTaskPerson,
        status: "todo",
        priority: "Medium",
      },
    ]);

    setNewTaskTitle("");
  }

  function sendMessage() {
    if (newMessage.trim() === "") return;

    setChatMessages([
      ...chatMessages,
      {
        sender: "You",
        text: newMessage,
        own: true,
      },
    ]);

    setNewMessage("");
  }

  return (
    <main className="dashboard">
      <aside className="sidebar">
        <h2>Team Track</h2>
        <nav>
          <button onClick={() => setActivePage("dashboard")}>Dashboard</button>
          <button onClick={() => setActivePage("projects")}>Projects</button>
          <button onClick={() => setActivePage("tasks")}>Tasks</button>
          <button onClick={() => setActivePage("messages")}>Messages</button>
          <button onClick={() => setActivePage("progress")}>Progress</button>
        </nav>
      </aside>

      <section className="dashboard-content">
        <header className="dashboard-header">
          <div>
            <p className="eyebrow">Welcome back</p>
            <h1>Project dashboard</h1>
          </div>
          <button onClick={() => setActivePage("projects")}>New project</button>
        </header>

        <div className="stats-grid">
          <article>
            <span>Active projects</span>
            <strong>{projects.length}</strong>
          </article>
          <article>
            <span>Open tasks</span>
            <strong>{tasks.length}</strong>
          </article>
          <article>
            <span>Messages</span>
            <strong>{chatMessages.length}</strong>
          </article>
          <article>
            <span>Progress</span>
            <strong>64%</strong>
          </article>
        </div>

        {activePage === "dashboard" && <DashboardHome projects={projects} />}
        {activePage === "projects" && (
          <ProjectsPage
            projects={projects}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            newProjectDeadline={newProjectDeadline}
            setNewProjectDeadline={setNewProjectDeadline}
            addProject={addProject}
            selectedProjectIndex={selectedProjectIndex}
            setSelectedProjectIndex={setSelectedProjectIndex}
            newMemberName={newMemberName}
            setNewMemberName={setNewMemberName}
            addMember={addMember}
          />
        )}
        {activePage === "tasks" && (
          <TasksPage
            tasks={tasks}
            allMembers={allMembers}
            newTaskTitle={newTaskTitle}
            setNewTaskTitle={setNewTaskTitle}
            newTaskPerson={newTaskPerson}
            setNewTaskPerson={setNewTaskPerson}
            addTask={addTask}
          />
        )}
        {activePage === "messages" && (
          <MessagesPage
            chatMessages={chatMessages}
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            sendMessage={sendMessage}
          />
        )}
        {activePage === "progress" && <ProgressPage projects={projects} />}
      </section>
    </main>
  );
}

function DashboardHome({ projects }) {
  return (
    <section className="panel">
      <h2>Current projects</h2>
      <div className="project-list">
        {projects.map((project) => (
          <article key={project.name}>
            <h3>{project.name}</h3>
            <p>Team members: {project.members.join(", ")}</p>
            <div className="progress-bar">
              <div style={{ width: `${project.progress}%` }}></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ProjectsPage({
  projects,
  newProjectName,
  setNewProjectName,
  newProjectDeadline,
  setNewProjectDeadline,
  addProject,
  selectedProjectIndex,
  setSelectedProjectIndex,
  newMemberName,
  setNewMemberName,
  addMember,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Projects</h2>
          <p>Create groups, invite members, and manage academic projects.</p>
        </div>
      </div>

      <div className="project-actions">
        <div className="task-form">
          <input
            type="text"
            placeholder="Project name"
            value={newProjectName}
            onChange={(event) => setNewProjectName(event.target.value)}
          />
          <input
            type="text"
            placeholder="Deadline"
            value={newProjectDeadline}
            onChange={(event) => setNewProjectDeadline(event.target.value)}
          />
          <button type="button" onClick={addProject}>
            Create project
          </button>
        </div>

        <div className="task-form">
          <select
            value={selectedProjectIndex}
            onChange={(event) => setSelectedProjectIndex(event.target.value)}
          >
            {projects.map((project, index) => (
              <option value={index} key={project.name}>
                {project.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Member name"
            value={newMemberName}
            onChange={(event) => setNewMemberName(event.target.value)}
          />

          <button type="button" onClick={addMember}>
            Add member
          </button>
        </div>
      </div>

      <div className="project-list">
        {projects.map((project) => (
          <article key={project.name}>
            <h3>{project.name}</h3>
            <p>Deadline: {project.deadline}</p>
            <p>Members: {project.members.join(", ")}</p>
            <span className={`status ${project.status === "Review" ? "review" : "active"}`}>
              {project.status}
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function TasksPage({
  tasks,
  allMembers,
  newTaskTitle,
  setNewTaskTitle,
  newTaskPerson,
  setNewTaskPerson,
  addTask,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Tasks</h2>
          <p>Create, assign, and update project tasks.</p>
        </div>
      </div>

      <div className="task-form">
        <input
          type="text"
          placeholder="New task title"
          value={newTaskTitle}
          onChange={(event) => setNewTaskTitle(event.target.value)}
        />

        <select
          value={newTaskPerson}
          onChange={(event) => setNewTaskPerson(event.target.value)}
        >
          {allMembers.map((member) => (
            <option key={member}>{member}</option>
          ))}
        </select>

        <button type="button" onClick={addTask}>
          Add task
        </button>
      </div>

      <div className="task-board">
        <TaskColumn title="To do" tasks={tasks.filter((task) => task.status === "todo")} />
        <TaskColumn title="In progress" tasks={tasks.filter((task) => task.status === "in-progress")} />
        <TaskColumn title="Completed" tasks={tasks.filter((task) => task.status === "completed")} />
      </div>
    </section>
  );
}

function TaskColumn({ title, tasks }) {
  return (
    <div className="task-column">
      <h3>{title}</h3>
      {tasks.map((task, index) => (
        <article className="task-card" key={index}>
          <h4>{task.title}</h4>
          <p>Assigned to {task.assignedTo}</p>
          <span className={`priority ${task.priority.toLowerCase()}`}>
            {task.priority}
          </span>
        </article>
      ))}
    </div>
  );
}

function MessagesPage({ chatMessages, newMessage, setNewMessage, sendMessage }) {
  return (
    <section className="panel">
      <div className="message-list">
        {chatMessages.map((chatMessage, index) => (
          <article
            className={`chat-message ${chatMessage.own ? "own" : ""}`}
            key={index}
          >
            <strong>{chatMessage.sender}</strong>
            <p>{chatMessage.text}</p>
          </article>
        ))}
      </div>

      <div className="message-input">
        <input
          type="text"
          placeholder="Write a message..."
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
        />
        <button type="button" onClick={sendMessage}>
          Send
        </button>
      </div>
    </section>
  );
}

function ProgressPage({ projects }) {
  return (
    <section className="panel">
      <h2>Progress</h2>
      <p>Track project completion based on finished tasks.</p>

      <div className="project-list">
        {projects.map((project) => (
          <article key={project.name}>
            <h3>{project.name}</h3>
            <p>{project.progress}% completed</p>
            <div className="progress-bar">
              <div style={{ width: `${project.progress}%` }}></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default App;