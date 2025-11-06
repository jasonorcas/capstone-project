import { useState, useEffect } from "react";

// ---------------------------
// Task Manager Component
// ---------------------------
export default function TaskManager() {
    const [tasks, setTasks] = useState([]);
    const [taskName, setTaskName] = useState("");
    const [taskDeadline, setTaskDeadline] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("all");

    // Get environment variables
    const API_URL = import.meta.env.VITE_API_URL;
    const APP_NAME = import.meta.env.VITE_APP_NAME;

    // ---------------------------
    // Fetch Tasks Function
    // ---------------------------
    const getTasks = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/";
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    localStorage.removeItem("token");
                    localStorage.removeItem("user");
                    window.location.href = "/";
                    return;
                }
                throw new Error(`Failed to fetch tasks: ${response.status}`);
            }

            const result = await response.json();
            setTasks(result);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setError("Failed to load tasks");
        }
    };

    // ---------------------------
    // Add Task Function
    // ---------------------------
    const addTask = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) {
            window.location.href = "/";
            return;
        }

        if (!taskName || !taskDeadline) {
            setError("Task title and deadline are required");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: taskName,
                    description: taskDescription,
                    deadline: taskDeadline,
                    assignedTo: assignedTo || null,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to create task");
            }

            // Clear form and refresh tasks
            setTaskName("");
            setTaskDescription("");
            setTaskDeadline("");
            setAssignedTo("");
            await getTasks();
        } catch (error) {
            console.error("Error creating task:", error);
            setError(error.message || "Failed to create task");
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------
    // Update Task Status Function
    // ---------------------------
    const updateTaskStatus = async (taskId, newStatus) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    status: newStatus,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update task status");
            }

            await getTasks();
        } catch (error) {
            console.error("Error updating task status:", error);
            setError("Failed to update task status");
        }
    };

    // ---------------------------
    // Delete Task Function
    // ---------------------------
    const deleteTask = async (taskId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

        if (!confirm("Are you sure you want to delete this task?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/tasks/${taskId}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to delete task");
            }

            await getTasks();
        } catch (error) {
            console.error("Error deleting task:", error);
            setError("Failed to delete task");
        }
    };

    // ---------------------------
    // Logout Function
    // ---------------------------
    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/";
    };

    // ---------------------------
    // Filter Tasks by Status
    // ---------------------------
    const filteredTasks = tasks.filter((task) => {
        if (activeTab === "all") return true;
        return task.status === activeTab;
    });

    // ---------------------------
    // Task Statistics
    // ---------------------------
    const taskStats = {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "Pending").length,
        inProgress: tasks.filter((t) => t.status === "In Progress").length,
        completed: tasks.filter((t) => t.status === "Completed").length,
        overdue: tasks.filter((t) => t.status === "Overdue").length,
    };

    useEffect(() => {
        getTasks();
    }, []);

    // Get current user for display
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="dashboard-brand">
                    <div>
                        <h1 className="dashboard-title">
                            Welcome back,{" "}
                            <strong>{currentUser?.firstName || "User"}</strong>
                        </h1>
                        <p className="dashboard-welcome">
                            You have {taskStats.total} task
                            {taskStats.total !== 1 ? "s" : ""} in total.
                        </p>
                    </div>
                </div>
                <button onClick={logout} className="btn btn-outline">
                    Logout
                </button>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="card stat-card">
                    <div
                        className="stat-number"
                        style={{ color: "var(--primary-color)" }}
                    >
                        {taskStats.total}
                    </div>
                    <div className="stat-label">Total Tasks</div>
                </div>
                <div className="card stat-card">
                    <div
                        className="stat-number"
                        style={{ color: "var(--warning-color)" }}
                    >
                        {taskStats.pending}
                    </div>
                    <div className="stat-label">Pending</div>
                </div>
                <div className="card stat-card">
                    <div
                        className="stat-number"
                        style={{ color: "var(--primary-color)" }}
                    >
                        {taskStats.inProgress}
                    </div>
                    <div className="stat-label">In Progress</div>
                </div>
                <div className="card stat-card">
                    <div
                        className="stat-number"
                        style={{ color: "var(--accent-color)" }}
                    >
                        {taskStats.completed}
                    </div>
                    <div className="stat-label">Completed</div>
                </div>
            </div>

            {/* Error Display */}
            {error && <div className="error-message">{error}</div>}

            <div className="task-grid">
                {/* Add Task Form */}
                <div className="card task-form-container">
                    <h3 className="task-form-title">Create New Task</h3>
                    <form onSubmit={addTask}>
                        <div className="form-group">
                            <label className="form-label">Task Title *</label>
                            <input
                                type="text"
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                placeholder="What needs to be done?"
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Description</label>
                            <textarea
                                value={taskDescription}
                                onChange={(e) =>
                                    setTaskDescription(e.target.value)
                                }
                                placeholder="Add a description (optional)"
                                className="form-input form-textarea"
                                maxLength={255}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Deadline *</label>
                            <input
                                type="datetime-local"
                                value={taskDeadline}
                                onChange={(e) =>
                                    setTaskDeadline(e.target.value)
                                }
                                className="form-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Assign To (User ID)
                            </label>
                            <input
                                type="text"
                                placeholder="Optional - enter user ID"
                                value={assignedTo}
                                onChange={(e) => setAssignedTo(e.target.value)}
                                className="form-input"
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="loading-spinner"></span>
                                    Creating Task...
                                </>
                            ) : (
                                "Create Task"
                            )}
                        </button>
                    </form>
                </div>

                {/* Tasks List */}
                <div className="tasks-container">
                    {/* Filter Tabs */}
                    <div className="task-filters">
                        {[
                            {
                                key: "all",
                                label: "All Tasks",
                                count: taskStats.total,
                            },
                            {
                                key: "Pending",
                                label: "Pending",
                                count: taskStats.pending,
                            },
                            {
                                key: "In Progress",
                                label: "In Progress",
                                count: taskStats.inProgress,
                            },
                            {
                                key: "Completed",
                                label: "Completed",
                                count: taskStats.completed,
                            },
                            {
                                key: "Overdue",
                                label: "Overdue",
                                count: taskStats.overdue,
                            },
                        ].map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`btn btn-sm ${
                                    activeTab === tab.key
                                        ? "btn-primary"
                                        : "btn-outline"
                                }`}
                                style={{ borderRadius: "20px" }}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Tasks List */}
                    {filteredTasks.length === 0 ? (
                        <div className="card empty-state">
                            <div className="empty-state-icon">📝</div>
                            <h3 className="mb-4">No tasks found</h3>
                            <p className="text-muted">
                                {activeTab === "all"
                                    ? "Get started by creating your first task!"
                                    : `No ${activeTab.toLowerCase()} tasks found`}
                            </p>
                        </div>
                    ) : (
                        <div className="tasks-container">
                            {filteredTasks.map((task) => (
                                <div key={task._id} className="card task-card">
                                    <div className="task-header">
                                        <div style={{ flex: 1 }}>
                                            <h4 className="task-title">
                                                {task.title}
                                                <span
                                                    className={`status-badge status-${task.status
                                                        .toLowerCase()
                                                        .replace(" ", "-")}`}
                                                >
                                                    {task.status}
                                                </span>
                                            </h4>
                                            {task.description && (
                                                <p className="task-description">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="task-meta">
                                                <div className="task-meta-item">
                                                    <span>📅</span>
                                                    <span>
                                                        {new Date(
                                                            task.deadline
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="task-meta-item">
                                                    <span>🆔</span>
                                                    <span>{task.uuid}</span>
                                                </div>
                                                {task.assignedTo && (
                                                    <div className="task-meta-item">
                                                        <span>👤</span>
                                                        <span>
                                                            {task.assignedTo
                                                                .username ||
                                                                task.assignedTo
                                                                    ._id}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="task-actions">
                                            <select
                                                value={task.status}
                                                onChange={(e) =>
                                                    updateTaskStatus(
                                                        task._id,
                                                        e.target.value
                                                    )
                                                }
                                                className="form-input form-select"
                                                style={{ fontSize: "0.875rem" }}
                                            >
                                                <option value="Pending">
                                                    Pending
                                                </option>
                                                <option value="In Progress">
                                                    In Progress
                                                </option>
                                                <option value="Completed">
                                                    Completed
                                                </option>
                                            </select>
                                            <button
                                                onClick={() =>
                                                    deleteTask(task._id)
                                                }
                                                className="btn btn-danger btn-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
