import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

    // Get environment variables
    const API_URL = import.meta.env.VITE_API_URL;

    // Load current user data
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

    const handleProfileChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
        setMessage("");
        setError("");
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value,
        });
        setMessage("");
        setError("");
    };

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

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError("New passwords do not match");
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
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter your current password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="newPassword">New Password</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                placeholder="Enter new password"
                                required
                            />
                            <small className="field-note">
                                Password must contain at least 1 uppercase
                                letter, 1 lowercase letter, 1 number, and 1
                                symbol
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                placeholder="Confirm new password"
                                required
                            />
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
