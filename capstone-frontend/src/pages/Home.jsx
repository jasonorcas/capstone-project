import { useState } from "react";
import { Link } from "react-router-dom";

// ---------------------------
// Home/Login Page Component
// ---------------------------
export default function Home({ setUser }) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const APP_NAME = import.meta.env.VITE_APP_NAME;

    // ---------------------------
    // Handle Login Form Submission
    // ---------------------------
    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ login, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Login failed");
            }

            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));

            // Update user state in App component
            if (setUser) {
                setUser(result.user);
            }

            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------
    // Toggle Password Visibility
    // ---------------------------
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <img
                        src="/logo.png"
                        alt={`${APP_NAME} Logo`}
                        className="auth-logo"
                    />
                    <h1 className="auth-title">Welcome to {APP_NAME}</h1>
                    <p className="auth-subtitle">
                        Sign in to manage your tasks
                    </p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Username or Email</label>
                        <input
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            placeholder="Enter your username or email"
                            className="form-input"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div className="password-input-container">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="form-input"
                                required
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={togglePasswordVisibility}
                            >
                                <span
                                    className={`eye-icon ${
                                        showPassword ? "eye-slash" : "eye-open"
                                    }`}
                                ></span>
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-muted mb-0">
                        Don't have an account?{" "}
                        <Link
                            to="/register"
                            style={{
                                color: "var(--primary-color)",
                                textDecoration: "none",
                                fontWeight: "600",
                            }}
                        >
                            Create account
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
