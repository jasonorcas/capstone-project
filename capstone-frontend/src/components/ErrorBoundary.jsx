import { Component } from "react";

// ---------------------------
// Error Boundary Component
// - Catches JavaScript errors in child components
// ---------------------------
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Error caught by boundary:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div
                    style={{
                        padding: "2rem",
                        textAlign: "center",
                        maxWidth: "500px",
                        margin: "0 auto",
                    }}
                >
                    <h2 style={{ color: "#dc3545" }}>Something went wrong</h2>
                    <p style={{ margin: "1rem 0", color: "#666" }}>
                        {this.state.error?.message ||
                            "An unexpected error occurred"}
                    </p>
                    <button
                        onClick={() =>
                            this.setState({ hasError: false, error: null })
                        }
                        style={{
                            padding: "0.5rem 1rem",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                        }}
                    >
                        Try again
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
