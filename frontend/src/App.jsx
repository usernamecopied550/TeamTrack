import { useState } from "react";
import "./App.css";

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (isRegistering) {
      setMessage("Account created successfully. You can now log in.");
      setIsRegistering(false);
    } else {
      setMessage("");
      setIsLoggedIn(true);
    }
  }

  if (isLoggedIn) {
    return <Dashboard />;
  }

  return (
    <main className="app">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Team Track</p>
          <h1>Student project collaboration system</h1>
          <p>
            A React frontend connected to an ASP.NET Core API and MySQL
            database.
          </p>
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
            <input type="email" placeholder="student@teamtrack.edu" />
          </label>

          <label>
            Password
            <input type="password" placeholder="Password" />
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

  const [chatMessages, setChatMessages] = useState([
    {
      sender: "Rania",
      text: "I created the project group and added the first tasks.",
      own: false,
    },
    {
      sender: "Cindy",
      text: "I started the MySQL database schema.",
      own: false,
    },
    {
      sender: "You",
      text: "I will connect the React frontend to the ASP.NET Core API.",
      own: true,
    },
  ]);

  const [newMessage, setNewMessage] = useState("");

  const [tasks, setTasks] = useState([
    {
      title: "Create login validation",
      assignedTo: "Rania",
      status: "todo",
      priority: "High",
    },
    {
      title: "Prepare MySQL schema",
      assignedTo: "Cindy",
      status: "todo",
      priority: "Medium",
    },
    {
      title: "Build ASP.NET Core auth API",
      assignedTo: "Omar",
      status: "in-progress",
      priority: "High",
    },
    {
      title: "Draft component architecture",
      assignedTo: "Rania",
      status: "completed",
      priority: "Low",
    },
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPerson, setNewTaskPerson] = useState("Rania");

  function sendMessage() {
    if (newMessage.trim() === "") {
      return;
    }

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

  function addTask() {
    if (newTaskTitle.trim() === "") {
      return;
    }

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

          <button>New project</button>
        </header>

        <div className="stats-grid">
          <article>
            <span>Active projects</span>
            <strong>3</strong>
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

        {activePage === "dashboard" && <DashboardHome />}
        {activePage === "projects" && <ProjectsPage />}

        {activePage === "tasks" && (
          <TasksPage
            tasks={tasks}
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

        {activePage === "progress" && <ProgressPage />}
      </section>
    </main>
  );
}

function DashboardHome() {
  return (
    <section className="panel">
      <h2>Current projects</h2>

      <div className="project-list">
        <article>
          <h3>Web Engineering Project</h3>
          <p>Team members: Rania, Cindy, Omar</p>
          <div className="progress-bar">
            <div style={{ width: "70%" }}></div>
          </div>
        </article>

        <article>
          <h3>Database Lab</h3>
          <p>Team members: Lina, Adam, Sofia</p>
          <div className="progress-bar">
            <div style={{ width: "45%" }}></div>
          </div>
        </article>
      </div>
    </section>
  );
}

function ProjectsPage() {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <h2>Projects</h2>
          <p>Create groups, invite members, and manage academic projects.</p>
        </div>

        <button>+ Create project</button>
      </div>

      <div className="project-list">
        <article>
          <h3>Web Engineering Project</h3>
          <p>Deadline: 18 June 2026</p>
          <p>Members: Rania, Cindy, Omar</p>
          <span className="status active">Active</span>
        </article>

        <article>
          <h3>Database Lab</h3>
          <p>Deadline: 24 June 2026</p>
          <p>Members: Lina, Adam, Sofia</p>
          <span className="status active">Active</span>
        </article>

        <article>
          <h3>Research Methods</h3>
          <p>Deadline: 10 June 2026</p>
          <p>Members: Rania, Lina</p>
          <span className="status review">Review</span>
        </article>
      </div>
    </section>
  );
}

function TasksPage({
  tasks,
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
          <option>Rania</option>
          <option>Cindy</option>
          <option>Omar</option>
          <option>Lina</option>
        </select>

        <button type="button" onClick={addTask}>
          Add task
        </button>
      </div>

      <div className="task-board">
        <TaskColumn
          title="To do"
          tasks={tasks.filter((task) => task.status === "todo")}
        />

        <TaskColumn
          title="In progress"
          tasks={tasks.filter((task) => task.status === "in-progress")}
        />

        <TaskColumn
          title="Completed"
          tasks={tasks.filter((task) => task.status === "completed")}
        />
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

function MessagesPage({
  chatMessages,
  newMessage,
  setNewMessage,
  sendMessage,
}) {
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

function ProgressPage() {
  return (
    <section className="panel">
      <h2>Progress</h2>
      <p>Track project completion based on finished tasks.</p>
    </section>
  );
}

export default App;