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

    // Get environment variables
    const API_URL = import.meta.env.VITE_API_URL;
    const APP_NAME = import.meta.env.VITE_APP_NAME;

    // ---------------------------
    // Component Styles
    // ---------------------------
    const containerStyle = {
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
    };

    const headerStyle = {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "30px",
        borderBottom: "1px solid #ddd",
        paddingBottom: "20px",
    };

    const formStyle = {
        backgroundColor: "#f9f9f9",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "30px",
    };

    const inputStyle = {
        padding: "10px",
        margin: "5px",
        border: "1px solid #ccc",
        borderRadius: "4px",
        width: "100%",
        fontSize: "16px",
    };

    const buttonStyle = {
        padding: "10px 20px",
        margin: "5px",
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontSize: "16px",
    };

    const taskCardStyle = {
        backgroundColor: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "15px",
        margin: "10px 0",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    };

    const statusStyle = {
        padding: "4px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        marginLeft: "10px",
    };

    const statusColors = {
        Pending: { backgroundColor: "#fff3cd", color: "#856404" },
        "In Progress": { backgroundColor: "#d1ecf1", color: "#0c5460" },
        Completed: { backgroundColor: "#d4edda", color: "#155724" },
        Overdue: { backgroundColor: "#f8d7da", color: "#721c24" },
    };

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

            await getTasks(); // Refresh the task list
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

            await getTasks(); // Refresh the task list
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

    useEffect(() => {
        getTasks();
    }, []);

    // Get current user for display
    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <div>
                    <h1>{APP_NAME}</h1>
                    <p>Welcome, {currentUser?.username || "User"}!</p>
                </div>
                <button
                    onClick={logout}
                    style={{ ...buttonStyle, backgroundColor: "#dc3545" }}
                >
                    Logout
                </button>
            </div>

            {error && (
                <div
                    style={{
                        color: "red",
                        backgroundColor: "#ffe6e6",
                        padding: "10px",
                        borderRadius: "4px",
                        marginBottom: "20px",
                        border: "1px solid red",
                    }}
                >
                    {error}
                </div>
            )}

            {/* Add Task Form */}
            <form onSubmit={addTask} style={formStyle}>
                <h3>Add New Task</h3>
                <div style={{ display: "grid", gap: "10px" }}>
                    <input
                        type="text"
                        placeholder="Task Title *"
                        value={taskName}
                        onChange={(e) => setTaskName(e.target.value)}
                        style={inputStyle}
                        required
                    />
                    <textarea
                        placeholder="Task Description"
                        value={taskDescription}
                        onChange={(e) => setTaskDescription(e.target.value)}
                        style={{ ...inputStyle, minHeight: "60px" }}
                        maxLength={255}
                    />
                    <input
                        type="datetime-local"
                        value={taskDeadline}
                        onChange={(e) => setTaskDeadline(e.target.value)}
                        style={inputStyle}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Assign to User ID (optional)"
                        value={assignedTo}
                        onChange={(e) => setAssignedTo(e.target.value)}
                        style={inputStyle}
                    />
                    <button
                        type="submit"
                        style={buttonStyle}
                        disabled={loading}
                    >
                        {loading ? "Adding..." : "Add Task"}
                    </button>
                </div>
            </form>

            {/* Tasks List */}
            <div>
                <h3>Your Tasks ({tasks.length})</h3>
                {tasks.length === 0 ? (
                    <p>No tasks found. Create your first task above!</p>
                ) : (
                    tasks.map((task) => (
                        <div key={task._id} style={taskCardStyle}>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "flex-start",
                                }}
                            >
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: "0 0 10px 0" }}>
                                        {task.title}
                                        <span
                                            style={{
                                                ...statusStyle,
                                                ...statusColors[task.status],
                                            }}
                                        >
                                            {task.status}
                                        </span>
                                    </h4>
                                    {task.description && (
                                        <p
                                            style={{
                                                margin: "5px 0",
                                                color: "#666",
                                            }}
                                        >
                                            {task.description}
                                        </p>
                                    )}
                                    <p
                                        style={{
                                            margin: "5px 0",
                                            fontSize: "14px",
                                            color: "#888",
                                        }}
                                    >
                                        <strong>Deadline:</strong>{" "}
                                        {new Date(
                                            task.deadline
                                        ).toLocaleString()}
                                    </p>
                                    <p
                                        style={{
                                            margin: "5px 0",
                                            fontSize: "14px",
                                            color: "#888",
                                        }}
                                    >
                                        <strong>UUID:</strong> {task.uuid}
                                    </p>
                                    {task.assignedTo && (
                                        <p
                                            style={{
                                                margin: "5px 0",
                                                fontSize: "14px",
                                                color: "#888",
                                            }}
                                        >
                                            <strong>Assigned to:</strong>{" "}
                                            {task.assignedTo.username ||
                                                task.assignedTo._id}
                                        </p>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "5px",
                                    }}
                                >
                                    <select
                                        value={task.status}
                                        onChange={(e) =>
                                            updateTaskStatus(
                                                task._id,
                                                e.target.value
                                            )
                                        }
                                        style={{
                                            padding: "5px",
                                            borderRadius: "4px",
                                        }}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">
                                            In Progress
                                        </option>
                                        <option value="Completed">
                                            Completed
                                        </option>
                                    </select>
                                    <button
                                        onClick={() => deleteTask(task._id)}
                                        style={{
                                            ...buttonStyle,
                                            backgroundColor: "#dc3545",
                                            padding: "5px 10px",
                                            fontSize: "12px",
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
