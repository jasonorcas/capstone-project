import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Register from "./pages/Register";
import TaskManager from "./pages/TaskManager";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

// ---------------------------
// Main App Component
// ---------------------------
function App() {
    const APP_NAME = import.meta.env.VITE_APP_NAME;
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <ErrorBoundary>
            <div className="app-container">
                <nav className="nav">
                    <div className="nav-container">
                        <Link to="/" className="nav-brand">
                            <img
                                src="/logo.png"
                                alt={`${APP_NAME} Logo`}
                                className="nav-logo"
                            />
                        </Link>
                        <div className="nav-links">
                            {user.id ? (
                                <>
                                    <span className="nav-welcome">
                                        Welcome, {user.username}
                                    </span>
                                    <Link to="/dashboard" className="nav-link">
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={() => {
                                            localStorage.removeItem("token");
                                            localStorage.removeItem("user");
                                            window.location.href = "/";
                                        }}
                                        className="nav-link logout-btn"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/" className="nav-link">
                                        Login
                                    </Link>
                                    <Link to="/register" className="nav-link">
                                        Register
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/register" element={<Register />} />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <TaskManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/tasks"
                            element={
                                <ProtectedRoute>
                                    <TaskManager />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </main>
            </div>
        </ErrorBoundary>
    );
}

export default App;
