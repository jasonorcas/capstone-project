import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ---------------------------
// Profile Component
// ---------------------------
const Profile = ({ setUser }) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        username: "",
    });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const navigate = useNavigate();

    // Password change state
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Password visibility state
    const [showPasswords, setShowPasswords] = useState({
        currentPassword: false,
        newPassword: false,
        confirmPassword: false,
    });

    // Get environment variables
    const API_URL = import.meta.env.VITE_API_URL;

    // ---------------------------
    // Password Validation Function
    // ---------------------------
    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
            password
        );

        if (password.length < minLength) {
            return {
                isValid: false,
                message: "Password must be at least 8 characters long",
            };
        }
        if (!hasUpperCase) {
            return {
                isValid: false,
                message: "Password must contain at least one uppercase letter",
            };
        }
        if (!hasLowerCase) {
            return {
                isValid: false,
                message: "Password must contain at least one lowercase letter",
            };
        }
        if (!hasNumber) {
            return {
                isValid: false,
                message: "Password must contain at least one number",
            };
        }
        if (!hasSymbol) {
            return {
                isValid: false,
                message: "Password must contain at least one symbol",
            };
        }

        return { isValid: true, message: "Password is valid" };
    };

    // ---------------------------
    // Toggle Password Visibility
    // ---------------------------
    const togglePasswordVisibility = (field) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    // ---------------------------
    // Load Current User Data
    // ---------------------------
    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            const user = JSON.parse(userData);
            setFormData({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                email: user.email || "",
                username: user.username || "",
            });
        }
    }, []);

    // ---------------------------
    // Handle Profile Form Changes
    // ---------------------------
    const handleProfileChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setMessage("");
        setError("");
    };

    // ---------------------------
    // Handle Password Form Changes
    // ---------------------------
    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
        setMessage("");
        setError("");
    };

    // ---------------------------
    // Handle Profile Form Submission
    // ---------------------------
    const handleProfileSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("No authentication token found. Please log in again.");
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/auth/profile`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("user", JSON.stringify(data.user));
                setUser(data.user);
                setMessage(data.message || "Profile updated successfully!");
            } else {
                setError(data.message || "Failed to update profile");
            }
        } catch (error) {
            setError("Network error. Please try again.");
            console.error("Profile update error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // ---------------------------
    // Handle Password Form Submission
    // ---------------------------
    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        // Validate new password
        const passwordValidation = validatePassword(passwordData.newPassword);
        if (!passwordValidation.isValid) {
            setError(passwordValidation.message);
            return;
        }

        setIsLoading(true);
        setMessage("");
        setError("");

        try {
            const token = localStorage.getItem("token");

            if (!token) {
                setError("No authentication token found. Please log in again.");
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/auth/change-password`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || "Password updated successfully!");
                setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                });
            } else {
                setError(data.message || "Failed to change password");
            }
        } catch (error) {
            setError("Network error. Please try again.");
            console.error("Password change error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="dashboard-container">
            <div className="card">
                <h2>Account Settings</h2>

                {/* Tab Navigation */}
                <div className="tabs">
                    <button
                        className={`tab ${
                            activeTab === "profile" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("profile")}
                    >
                        Edit Profile
                    </button>
                    <button
                        className={`tab ${
                            activeTab === "password" ? "active" : ""
                        }`}
                        onClick={() => setActiveTab("password")}
                    >
                        Change Password
                    </button>
                </div>

                {message && (
                    <div className="alert alert-success">{message}</div>
                )}

                {error && <div className="alert alert-error">{error}</div>}

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <form
                        onSubmit={handleProfileSubmit}
                        className="profile-form"
                    >
                        <div className="form-group">
                            <label htmlFor="firstName">First Name</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleProfileChange}
                                placeholder="Enter your first name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lastName">Last Name</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleProfileChange}
                                placeholder="Enter your last name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleProfileChange}
                                placeholder="Enter your email"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleProfileChange}
                                placeholder="Enter your username"
                                required
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Updating..." : "Update Profile"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate("/dashboard")}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                )}

                {/* Password Tab */}
                {activeTab === "password" && (
                    <form
                        onSubmit={handlePasswordSubmit}
                        className="profile-form"
                    >
                        <div className="form-group">
                            <label htmlFor="currentPassword">
                                Current Password
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={
                                        showPasswords.currentPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="currentPassword"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter your current password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        togglePasswordVisibility(
                                            "currentPassword"
                                        )
                                    }
                                >
                                    <span
                                        className={`eye-icon ${
                                            showPasswords.currentPassword
                                                ? "eye-slash"
                                                : "eye-open"
                                        }`}
                                    ></span>
                                </button>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <div className="password-input-container">
                                <input
                                    type={
                                        showPasswords.newPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Enter new password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        togglePasswordVisibility("newPassword")
                                    }
                                >
                                    <span
                                        className={`eye-icon ${
                                            showPasswords.newPassword
                                                ? "eye-slash"
                                                : "eye-open"
                                        }`}
                                    ></span>
                                </button>
                            </div>
                            <small className="field-note">
                                Password must be at least 8 characters long and
                                contain at least 1 uppercase letter, 1 lowercase
                                letter, 1 number, and 1 symbol
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <div className="password-input-container">
                                <input
                                    type={
                                        showPasswords.confirmPassword
                                            ? "text"
                                            : "password"
                                    }
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="Confirm new password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() =>
                                        togglePasswordVisibility(
                                            "confirmPassword"
                                        )
                                    }
                                >
                                    <span
                                        className={`eye-icon ${
                                            showPasswords.confirmPassword
                                                ? "eye-slash"
                                                : "eye-open"
                                        }`}
                                    ></span>
                                </button>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isLoading}
                            >
                                {isLoading ? "Changing..." : "Change Password"}
                            </button>
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => setActiveTab("profile")}
                            >
                                Back to Profile
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Profile;
