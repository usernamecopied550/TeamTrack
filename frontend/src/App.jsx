import { useState } from "react";
import "./App.css";

function App() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (isRegistering) {
      setMessage("Account created successfully. You can now log in.");
      setIsRegistering(false);
    } else {
      setMessage("Login successful. Welcome to Team Track.");
    }
  }

  return (
    <main className="app">
      <section className="auth-card">
        <div>
          <p className="eyebrow">Team Track</p>
          <h1>Student project collaboration system</h1>
          <p>
            A React frontend connected to an ASP.NET Core API and MySQL database.
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

export default App;