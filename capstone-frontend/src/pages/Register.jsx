import { useState } from "react";
import { Link } from "react-router-dom";

// ---------------------------
// Register Page Component
// ---------------------------
export default function Register() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const APP_NAME = import.meta.env.VITE_APP_NAME;

    // ---------------------------
    // Handle Form Submission
    // ---------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Basic validation
        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters long");
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Registration failed");
            }

            // Auto-login after registration
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));
            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
                    <h1 className="auth-title">Create Account</h1>
                    <p className="auth-subtitle">
                        Join {APP_NAME} and start managing your tasks
                    </p>
                </div>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group mb-0">
                            <label className="form-label">First Name</label>
                            <input
                                name="firstName"
                                type="text"
                                value={formData.firstName}
                                onChange={handleChange}
                                placeholder="John"
                                className="form-input"
                            />
                        </div>
                        <div className="form-group mb-0">
                            <label className="form-label">Last Name</label>
                            <input
                                name="lastName"
                                type="text"
                                value={formData.lastName}
                                onChange={handleChange}
                                placeholder="Doe"
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Username *</label>
                        <input
                            name="username"
                            type="text"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Choose a username"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="form-input"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password *</label>
                        <input
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
                            className="form-input"
                            required
                        />
                        <div
                            className="text-muted"
                            style={{ fontSize: "0.75rem", marginTop: "0.5rem" }}
                        >
                            Password must be at least 8 characters long
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-success btn-full"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loading-spinner"></span>
                                Creating Account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </button>
                </form>

                <div className="text-center mt-6">
                    <p className="text-muted mb-0">
                        Already have an account?{" "}
                        <Link
                            to="/"
                            style={{
                                color: "var(--primary-color)",
                                textDecoration: "none",
                                fontWeight: "600",
                            }}
                        >
                            Sign in here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
