import { Navigate } from "react-router-dom";

// ---------------------------
// Protected Route Component
// - Redirects to login if not authenticated
// ---------------------------
export default function ProtectedRoute({ children }) {
    const token = localStorage.getItem("token");
    return token ? children : <Navigate to="/" />;
}
