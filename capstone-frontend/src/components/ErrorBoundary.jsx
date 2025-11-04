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
                <div className="auth-container">
                    <div className="auth-card text-center">
                        <div className="empty-state-icon">⚠️</div>
                        <h2
                            className="auth-title"
                            style={{ color: "var(--danger-color)" }}
                        >
                            Something went wrong
                        </h2>
                        <p className="auth-subtitle mb-6">
                            {this.state.error?.message ||
                                "An unexpected error occurred"}
                        </p>
                        <button
                            onClick={() =>
                                this.setState({ hasError: false, error: null })
                            }
                            className="btn btn-primary"
                        >
                            Try again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
