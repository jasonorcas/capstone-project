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

    // ---------------------------
    // Component Styles
    // ---------------------------
    const containerStyle = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "80vh",
        padding: "1rem",
    };

    const formContainerStyle = {
        width: "100%",
        maxWidth: "400px",
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
    };

    const inputStyle = {
        padding: "10px",
        margin: "8px 0",
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "100%",
        fontSize: "16px",
        boxSizing: "border-box",
    };

    const buttonStyle = {
        padding: "12px",
        margin: "10px 0",
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
        width: "100%",
    };

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
        <div style={containerStyle}>
            <div style={formContainerStyle}>
                <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>
                    Create Account
                </h2>

                {error && (
                    <div
                        style={{
                            color: "red",
                            backgroundColor: "#ffe6e6",
                            padding: "10px",
                            borderRadius: "4px",
                            marginBottom: "1rem",
                            border: "1px solid red",
                        }}
                    >
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <input
                        name="username"
                        placeholder="Username *"
                        value={formData.username}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                    />
                    <input
                        name="email"
                        type="email"
                        placeholder="Email *"
                        value={formData.email}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                    />
                    <input
                        name="password"
                        type="password"
                        placeholder="Password *"
                        value={formData.password}
                        onChange={handleChange}
                        style={inputStyle}
                        required
                    />
                    <input
                        name="firstName"
                        placeholder="First Name"
                        value={formData.firstName}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                    <input
                        name="lastName"
                        placeholder="Last Name"
                        value={formData.lastName}
                        onChange={handleChange}
                        style={inputStyle}
                    />
                    <button
                        type="submit"
                        style={buttonStyle}
                        disabled={loading}
                    >
                        {loading ? "Creating Account..." : "Register"}
                    </button>
                </form>

                <p style={{ textAlign: "center", marginTop: "1rem" }}>
                    Already have an account?{" "}
                    <Link
                        to="/"
                        style={{
                            color: "#007bff",
                            textDecoration: "none",
                            fontWeight: "bold",
                        }}
                    >
                        Login here
                    </Link>
                </p>
            </div>
        </div>
    );
}
