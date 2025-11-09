import { useState } from "react";
import { Link } from "react-router-dom";

export default function Register({ setUser }) {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
    });
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const APP_NAME = import.meta.env.VITE_APP_NAME;

    const validateForm = () => {
        const newErrors = [];

        if (!formData.firstName.trim())
            newErrors.push("First name is required.");
        if (!formData.lastName.trim()) newErrors.push("Last name is required.");
        if (!formData.username.trim()) newErrors.push("Username is required.");
        else if (!/^[a-zA-Z0-9_]+$/.test(formData.username))
            newErrors.push(
                "Username can only contain letters, numbers, and underscores."
            );

        if (!formData.email.trim())
            newErrors.push("Email address is required.");
        else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(formData.email))
            newErrors.push("Please enter a valid email address.");

        if (!formData.password.trim()) newErrors.push("Password is required.");
        else if (
            !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
                formData.password
            )
        ) {
            newErrors.push(
                "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol."
            );
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors([]);
        setLoading(true);

        const clientErrors = validateForm();
        if (clientErrors.length > 0) {
            setErrors(clientErrors);
            setLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (!response.ok) {
                let backendErrors = [];

                // Handle validation and duplicate errors cleanly
                if (result.errors && typeof result.errors === "object") {
                    backendErrors = Object.values(result.errors);
                } else if (result.message) {
                    backendErrors = [result.message];
                } else {
                    backendErrors = ["Registration failed. Please try again."];
                }

                // Handle duplicate email/username from Mongo
                if (result.error && result.error.includes("duplicate key")) {
                    if (result.error.includes("email"))
                        backendErrors.push("This email is already registered.");
                    if (result.error.includes("username"))
                        backendErrors.push("This username is already taken.");
                }

                setErrors(backendErrors);
                return;
            }

            // Success
            localStorage.setItem("token", result.token);
            localStorage.setItem("user", JSON.stringify(result.user));
            if (setUser) setUser(result.user);
            window.location.href = "/dashboard";
        } catch (err) {
            setErrors([
                "An unexpected error occurred. Please try again later.",
            ]);
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

                {/* ---- Error Display Section ---- */}
                {errors.length > 0 && (
                    <div
                        className="error-alert"
                        style={{
                            backgroundColor: "#ffe5e5",
                            border: "1px solid #ffb3b3",
                            color: "#cc0000",
                            borderRadius: "8px",
                            padding: "12px 16px",
                            marginBottom: "20px",
                        }}
                    >
                        <ul style={{ margin: 0, paddingLeft: "20px" }}>
                            {errors.map((err, idx) => (
                                <li key={idx}>{err}</li>
                            ))}
                        </ul>
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-grid">
                        <div className="form-group mb-0">
                            <label className="form-label">First Name *</label>
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
                            <label className="form-label">Last Name *</label>
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
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address *</label>
                        <input
                            name="email"
                            type="text" // avoid browser validation popup
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="your@email.com"
                            className="form-input"
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
                        />
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
