import { useState } from "react";

// ---------------------------
// Home/Login Page Component
// ---------------------------
export default function Home() {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_URL;
    const APP_NAME = import.meta.env.VITE_APP_NAME;

    // ---------------------------
    // Component Styles
    // ---------------------------
    const textbox = {
        padding: "10px",
        margin: "5px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "250px",
        fontSize: "16px",
    };

    const button = {
        padding: "10px 20px",
        margin: "10px 5px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
    };

    const buttonDisabled = {
        ...button,
        backgroundColor: "#6c757d",
        cursor: "not-allowed",
    };

    const container = {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
    };

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
            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message || "Login failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={container}>
            <h1>Welcome to {APP_NAME}</h1>
            <p>Please login to use the Task Manager</p>

            {error && (
                <div
                    style={{
                        color: "red",
                        backgroundColor: "#ffe6e6",
                        padding: "10px",
                        borderRadius: "4px",
                        margin: "10px 0",
                        border: "1px solid red",
                        maxWidth: "300px",
                        textAlign: "center",
                    }}
                >
                    {error}
                </div>
            )}

            <form
                onSubmit={handleLogin}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                }}
            >
                <input
                    type="text"
                    value={login}
                    onChange={(e) => setLogin(e.target.value)}
                    placeholder="Username or Email"
                    style={textbox}
                    required
                    disabled={loading}
                />
                <br />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    style={textbox}
                    required
                    disabled={loading}
                />
                <br />
                <button
                    type="submit"
                    style={loading ? buttonDisabled : button}
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </form>

            <p style={{ marginTop: "20px" }}>
                Don't have an account?{" "}
                <a
                    href="/register"
                    style={{
                        color: "#007bff",
                        textDecoration: "none",
                        fontWeight: "bold",
                    }}
                    onMouseOver={(e) =>
                        (e.target.style.textDecoration = "underline")
                    }
                    onMouseOut={(e) => (e.target.style.textDecoration = "none")}
                >
                    Register here
                </a>
            </p>
        </div>
    );
}
