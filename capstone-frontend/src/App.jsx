import { Routes, Route, Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import TaskManager from "./pages/TaskManager";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";

// ---------------------------
// Helper function to get user's full name
// ---------------------------
const getUserFullName = (user) => {
    if (!user) return "Unknown User";

    // Use fullName from backend if available and valid
    if (
        user.fullName &&
        user.fullName !== "User" &&
        user.fullName !== "[object Object]"
    ) {
        return user.fullName;
    }

    // Fallback: calculate fullName manually from firstName and lastName
    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
        return user.firstName;
    } else if (user.lastName) {
        return user.lastName;
    } else {
        return user.username || "Unknown User";
    }
};

// ---------------------------
// Main App Component
// ---------------------------
function App() {
    const APP_NAME = import.meta.env.VITE_APP_NAME;
    const location = useLocation();

    // ---------------------------
    // State for user authentication
    // ---------------------------
    const [user, setUser] = useState(null);

    // ---------------------------
    // Check authentication on component mount and route changes
    // ---------------------------
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, [location]);

    // ---------------------------
    // Handle Logo Click
    // ---------------------------
    const handleLogoClick = () => {
        if (user) {
            window.location.href = "/dashboard";
        } else {
            window.location.href = "/";
        }
    };

    // ---------------------------
    // Logout Function
    // ---------------------------
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        window.location.href = "/";
    };

    return (
        <ErrorBoundary>
            <div className="app-container">
                {/* ---------------------------
                 * Navigation Bar
                 * --------------------------- */}
                <nav className="nav">
                    <div className="nav-container">
                        <div
                            className="nav-brand"
                            onClick={handleLogoClick}
                            style={{ cursor: "pointer" }}
                        >
                            <img
                                src="/logo.png"
                                alt={`${APP_NAME} Logo`}
                                className="nav-logo"
                            />
                            <span className="nav-title"></span>
                        </div>
                        <div className="nav-links">
                            {user ? (
                                <>
                                    <span className="nav-welcome">
                                        Welcome, {getUserFullName(user)}
                                    </span>
                                    <Link to="/profile" className="nav-link">
                                        Edit Profile
                                    </Link>
                                    <button
                                        onClick={logout}
                                        className="nav-link logout-btn"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    {location.pathname !== "/" && (
                                        <Link to="/" className="nav-link">
                                            Login
                                        </Link>
                                    )}
                                    {location.pathname !== "/register" && (
                                        <Link
                                            to="/register"
                                            className="nav-link"
                                        >
                                            Register
                                        </Link>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </nav>

                {/* ---------------------------
                 * Main Content Area
                 * --------------------------- */}
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home setUser={setUser} />} />
                        <Route
                            path="/register"
                            element={<Register setUser={setUser} />}
                        />
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
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile setUser={setUser} />
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
