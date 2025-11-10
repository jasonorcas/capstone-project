import { useState, useEffect, useRef } from "react";

// Helper function to get user's full name
const getUserFullName = (user) => {
    if (!user) return "Unknown User";

    if (
        user.fullName &&
        user.fullName !== "User" &&
        user.fullName !== "[object Object]"
    ) {
        return user.fullName;
    }

    if (user.firstName && user.lastName) {
        return `${user.firstName} ${user.lastName}`;
    } else if (user.firstName) {
        return user.firstName;
    } else if (user.lastName) {
        return user.lastName;
    } else {
        return user.username || "Unknown User";
    }
};

// ---------------------------
// Task Manager Component
// ---------------------------
export default function TaskManager() {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [modalError, setModalError] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [updateLoading, setUpdateLoading] = useState(false);
    const [showCommentsModal, setShowCommentsModal] = useState(false);

    // Form states
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskDeadline, setTaskDeadline] = useState("");
    const [assignedTo, setAssignedTo] = useState("");
    const [taskStatus, setTaskStatus] = useState("Pending");

    // Comments states
    const [commentContent, setCommentContent] = useState("");
    const [editingComment, setEditingComment] = useState(null);
    const [editCommentContent, setEditCommentContent] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [showCommentMenu, setShowCommentMenu] = useState(null);

    // User dropdown states
    const [allUsers, setAllUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState([]);

    // Notification states
    const [lastViewed, setLastViewed] = useState({});
    const [hasNewUpdates, setHasNewUpdates] = useState(false);

    // Modal ref for scrolling to error
    const modalBodyRef = useRef(null);
    const commentsModalBodyRef = useRef(null);

    // Get environment variables
    const API_URL = import.meta.env.VITE_API_URL;

    // ---------------------------
    // Form Validation Function
    // ---------------------------
    const validateForm = () => {
        if (!taskTitle.trim()) {
            setModalError("Task title is required");
            scrollToModalTop();
            return false;
        }

        if (!taskDeadline) {
            setModalError("Deadline is required");
            scrollToModalTop();
            return false;
        }

        const selectedDate = new Date(taskDeadline);
        const now = new Date();
        if (selectedDate <= now) {
            setModalError("Deadline must be in the future");
            scrollToModalTop();
            return false;
        }

        if (!taskStatus) {
            setModalError("Status is required");
            scrollToModalTop();
            return false;
        }

        return true;
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

            // Check for new updates after fetching tasks
            checkForNewUpdates(result);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            setError("Failed to load tasks");
        }
    };

    // ---------------------------
    // Notification Functions
    // ---------------------------
    const checkForNewUpdates = (tasksList) => {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        let hasUpdates = false;

        tasksList.forEach((task) => {
            if (hasNewUpdatesForTask(task, currentUser)) {
                hasUpdates = true;
            }
        });

        setHasNewUpdates(hasUpdates);
    };

    const hasNewUpdatesForTask = (task, currentUser) => {
        const taskId = task._id;
        const lastViewedTime = lastViewed[taskId] || 0;

        // Check for new comments
        if (task.comments && task.comments.length > 0) {
            const latestComment = task.comments[task.comments.length - 1];
            const commentTime = new Date(latestComment.createdAt).getTime();

            if (
                commentTime > lastViewedTime &&
                latestComment.user?._id !== currentUser._id
            ) {
                return true;
            }
        }

        // Check for task updates
        if (task.updatedAt) {
            const updateTime = new Date(task.updatedAt).getTime();
            if (updateTime > lastViewedTime) {
                return true;
            }
        }

        return false;
    };

    const markTaskAsViewed = (taskId) => {
        const newLastViewed = {
            ...lastViewed,
            [taskId]: Date.now(),
        };
        setLastViewed(newLastViewed);
        localStorage.setItem("lastViewedTasks", JSON.stringify(newLastViewed));
        checkForNewUpdates(tasks);
    };

    const getUpdateType = (task) => {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const taskId = task._id;
        const lastViewedTime = lastViewed[taskId] || 0;

        let hasNewComment = false;
        let hasTaskUpdate = false;

        // Check for new comments
        if (task.comments && task.comments.length > 0) {
            const latestComment = task.comments[task.comments.length - 1];
            const commentTime = new Date(latestComment.createdAt).getTime();

            if (
                commentTime > lastViewedTime &&
                latestComment.user?._id !== currentUser._id
            ) {
                hasNewComment = true;
            }
        }

        // Check for task updates
        if (task.updatedAt) {
            const updateTime = new Date(task.updatedAt).getTime();
            if (updateTime > lastViewedTime) {
                hasTaskUpdate = true;
            }
        }

        if (hasNewComment && hasTaskUpdate) return "New Updates";
        if (hasNewComment) return "New Comment";
        if (hasTaskUpdate) return "Updated";
        return null;
    };

    // Load last viewed times from localStorage
    useEffect(() => {
        const savedLastViewed = localStorage.getItem("lastViewedTasks");
        if (savedLastViewed) {
            setLastViewed(JSON.parse(savedLastViewed));
        }
    }, []);

    // ---------------------------
    // Fetch All Users Function
    // ---------------------------
    const getAllUsers = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const response = await fetch(`${API_URL}/auth/users`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error("Failed to fetch users");
            }

            const result = await response.json();
            setAllUsers(result);
        } catch (error) {
            console.error("Error fetching users:", error);
            setAllUsers([]);
        }
    };

    // ---------------------------
    // Create Task Function
    // ---------------------------
    const createTask = async (e) => {
        if (e) e.preventDefault();
        const token = localStorage.getItem("token");
        if (!token) return;

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setModalError("");

        try {
            const assignedUsers = selectedUsers.map(
                (user) => user.email || user.username
            );

            const response = await fetch(`${API_URL}/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: taskTitle.trim(),
                    description: taskDescription.trim(),
                    deadline: taskDeadline,
                    assignedTo: assignedUsers,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to create task");
            }

            resetForm();
            await getTasks();
            closeTaskModal();
        } catch (error) {
            console.error("Error creating task:", error);
            setModalError(error.message || "Failed to create task");
            scrollToModalTop();
        } finally {
            setLoading(false);
        }
    };

    // ---------------------------
    // Update Task Function - FIXED: Only send changed fields
    // ---------------------------
    const updateTask = async (e) => {
        if (e) e.preventDefault();
        if (!selectedTask) return;

        const token = localStorage.getItem("token");
        if (!token) return;

        // Validate form before submission
        if (!validateForm()) {
            return;
        }

        setUpdateLoading(true);
        setModalError("");

        try {
            const assignedUsers = selectedUsers.map(
                (user) => user.email || user.username
            );

            // Build updates object with only changed fields
            const updates = {};

            // Only include status if changed
            if (taskStatus !== selectedTask.status) {
                updates.status = taskStatus;
            }

            // Only include deadline if changed
            const originalDeadline = formatDateTimeForInput(
                selectedTask.deadline
            );
            if (taskDeadline !== originalDeadline) {
                updates.deadline = taskDeadline;
            }

            // Only include assignedTo if changed
            const originalAssignedUsers = (selectedTask.assignedTo || []).map(
                (user) => user.email || user.username
            );
            const newAssignedUsers = assignedUsers;

            // Check if assigned users changed
            const assignedUsersChanged =
                originalAssignedUsers.length !== newAssignedUsers.length ||
                !originalAssignedUsers.every((user) =>
                    newAssignedUsers.includes(user)
                ) ||
                !newAssignedUsers.every((user) =>
                    originalAssignedUsers.includes(user)
                );

            if (assignedUsersChanged) {
                updates.assignedTo = newAssignedUsers;
            }

            // If no changes, just close the modal
            if (Object.keys(updates).length === 0) {
                closeTaskModal();
                return;
            }

            const response = await fetch(
                `${API_URL}/tasks/${selectedTask._id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(updates),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Failed to update task");
            }

            await getTasks();
            closeTaskModal();
        } catch (error) {
            console.error("Error updating task:", error);
            setModalError(error.message || "Failed to update task");
            scrollToModalTop();
        } finally {
            setUpdateLoading(false);
        }
    };

    // ---------------------------
    // Delete Task Function
    // ---------------------------
    const deleteTask = async (taskId) => {
        const token = localStorage.getItem("token");
        if (!token) return;

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
            setShowDeleteConfirm(false);
            closeTaskModal();
        } catch (error) {
            console.error("Error deleting task:", error);
            setError("Failed to delete task");
        }
    };

    // ---------------------------
    // Comment Functions - FIXED: Allow comments on overdue tasks
    // ---------------------------
    const addComment = async (taskId, content, parentCommentId = null) => {
        if (!content || !content.trim()) {
            setModalError("Comment cannot be empty");
            scrollToModalTop();
            return false;
        }

        const token = localStorage.getItem("token");
        if (!token) return false;

        try {
            const response = await fetch(
                `${API_URL}/tasks/${taskId}/comments`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        content: content.trim(),
                        parentCommentId: parentCommentId,
                    }),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Failed to add comment");
            }

            const updatedTask = await response.json();

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task._id === taskId ? updatedTask : task
                )
            );

            if (selectedTask && selectedTask._id === taskId) {
                setSelectedTask(updatedTask);
            }

            // Clear the appropriate content
            if (parentCommentId) {
                setReplyContent("");
                setReplyingTo(null);
            } else {
                setCommentContent("");
            }

            return true;
        } catch (error) {
            console.error("Error adding comment:", error);
            setModalError(error.message || "Failed to add comment");
            scrollToModalTop();
            return false;
        }
    };

    const updateComment = async (taskId, commentId, content) => {
        if (!content || !content.trim()) {
            setModalError("Comment cannot be empty");
            scrollToModalTop();
            return false;
        }

        const token = localStorage.getItem("token");
        if (!token) return false;

        try {
            const response = await fetch(
                `${API_URL}/tasks/${taskId}/comments/${commentId}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ content: content.trim() }),
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Failed to update comment");
            }

            const updatedTask = await response.json();

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task._id === taskId ? updatedTask : task
                )
            );

            if (selectedTask && selectedTask._id === taskId) {
                setSelectedTask(updatedTask);
            }

            setEditingComment(null);
            setEditCommentContent("");
            setShowCommentMenu(null);
            return true;
        } catch (error) {
            console.error("Error updating comment:", error);
            setModalError(error.message || "Failed to update comment");
            scrollToModalTop();
            return false;
        }
    };

    const deleteComment = async (taskId, commentId) => {
        const token = localStorage.getItem("token");
        if (!token) return false;

        try {
            const response = await fetch(
                `${API_URL}/tasks/${taskId}/comments/${commentId}`,
                {
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const result = await response.json();
                throw new Error(result.message || "Failed to delete comment");
            }

            const updatedTask = await response.json();

            setTasks((prevTasks) =>
                prevTasks.map((task) =>
                    task._id === taskId ? updatedTask : task
                )
            );

            if (selectedTask && selectedTask._id === taskId) {
                setSelectedTask(updatedTask);
            }

            setShowCommentMenu(null);
            return true;
        } catch (error) {
            console.error("Error deleting comment:", error);
            setModalError(error.message || "Failed to delete comment");
            scrollToModalTop();
            return false;
        }
    };

    // ---------------------------
    // User Dropdown Functions
    // ---------------------------
    const filteredUsers = allUsers.filter(
        (user) =>
            getUserFullName(user)
                .toLowerCase()
                .includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const addUserToSelection = (user) => {
        if (!selectedUsers.find((u) => u._id === user._id)) {
            setSelectedUsers((prev) => [...prev, user]);
        }
        setSearchQuery("");
        setShowUserDropdown(false);
    };

    const removeUserFromSelection = (userId) => {
        setSelectedUsers((prev) => prev.filter((user) => user._id !== userId));
    };

    // ---------------------------
    // Modal Functions
    // ---------------------------
    const openCreateModal = () => {
        setIsCreating(true);
        setSelectedTask(null);
        resetForm();
        setModalError("");
        setShowTaskModal(true);
        getAllUsers();
    };

    const openEditModal = (task) => {
        setIsCreating(false);
        setSelectedTask(task);

        setTaskTitle(task.title);
        setTaskDescription(task.description || "");
        setTaskDeadline(formatDateTimeForInput(task.deadline));
        setTaskStatus(task.status);

        if (task.assignedTo && task.assignedTo.length > 0) {
            setSelectedUsers(task.assignedTo);
        } else {
            setSelectedUsers([]);
        }

        setModalError("");
        setShowDeleteConfirm(false);
        setShowTaskModal(true);
        getAllUsers();

        // Mark task as viewed when opening edit modal - FIXED: This removes "Updated" badge immediately
        markTaskAsViewed(task._id);
    };

    const openCommentsModal = (task) => {
        setSelectedTask(task);
        setShowCommentsModal(true);
        markTaskAsViewed(task._id);
    };

    const closeTaskModal = () => {
        setShowTaskModal(false);
        setSelectedTask(null);
        setIsCreating(false);
        setShowDeleteConfirm(false);
        setUpdateLoading(false);
        setEditingComment(null);
        setEditCommentContent("");
        setCommentContent("");
        setReplyingTo(null);
        setReplyContent("");
        setShowCommentMenu(null);
        setModalError("");
        setSelectedUsers([]);
        setSearchQuery("");
        setShowUserDropdown(false);
        resetForm();
    };

    const closeCommentsModal = () => {
        setShowCommentsModal(false);
        setSelectedTask(null);
        setEditingComment(null);
        setEditCommentContent("");
        setCommentContent("");
        setReplyingTo(null);
        setReplyContent("");
        setShowCommentMenu(null);
    };

    const resetForm = () => {
        setTaskTitle("");
        setTaskDescription("");
        setTaskDeadline("");
        setSelectedUsers([]);
        setTaskStatus("Pending");
    };

    // Scroll to top of modal when error occurs
    const scrollToModalTop = () => {
        if (modalBodyRef.current) {
            modalBodyRef.current.scrollTop = 0;
        }
    };

    const scrollToCommentsModalTop = () => {
        if (commentsModalBodyRef.current) {
            commentsModalBodyRef.current.scrollTop = 0;
        }
    };

    // ---------------------------
    // Utility Functions
    // ---------------------------
    const formatDateTimeForInput = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
    };

    const formatDateTimeForDisplay = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (isCreating) {
            await createTask(e);
        } else {
            await updateTask(e);
        }
    };

    const isCommentAuthor = (comment) => {
        try {
            const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );
            return comment.user?._id === currentUser._id;
        } catch (error) {
            return false;
        }
    };

    // FIXED: canEditTask function - allow assigned users to update status
    const canEditTask = (task) => {
        try {
            const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );
            const currentUserId = currentUser._id;

            // Creator can always edit
            const creatorId = task.createdBy?._id?.toString();
            if (creatorId === currentUserId?.toString()) {
                return true;
            }

            // Check if current user is in assignedTo array
            if (task.assignedTo && Array.isArray(task.assignedTo)) {
                const isAssigned = task.assignedTo.some((user) => {
                    const userId = user._id?.toString() || user?.toString();
                    return userId === currentUserId?.toString();
                });

                // Assigned users can edit (update status, add comments)
                return isAssigned;
            }

            return false;
        } catch (error) {
            console.error("Error in canEditTask:", error);
            return false;
        }
    };

    const getAssignedUsersCount = (task) => {
        if (!task.assignedTo || !Array.isArray(task.assignedTo)) {
            return 0;
        }
        return task.assignedTo.length;
    };

    const getAssignedUsersNames = (task) => {
        if (!task.assignedTo || !Array.isArray(task.assignedTo)) {
            return [];
        }
        return task.assignedTo.map((user) => getUserFullName(user));
    };

    const isTaskCreator = (task) => {
        try {
            const currentUser = JSON.parse(
                localStorage.getItem("user") || "{}"
            );
            const currentUserId = currentUser._id;

            const creatorId = task.createdBy?._id?.toString();
            return creatorId === currentUserId?.toString();
        } catch (error) {
            return false;
        }
    };

    // Get parent comment info for replies
    const getParentCommentInfo = (comment, allComments) => {
        if (!comment.parentCommentId) return null;

        const parentComment = allComments.find(
            (c) => c._id === comment.parentCommentId
        );
        if (!parentComment) return null;

        return {
            author: getUserFullName(parentComment.user),
            content:
                parentComment.content.length > 50
                    ? parentComment.content.substring(0, 50) + "..."
                    : parentComment.content,
        };
    };

    // Render comments with reply indicators
    const renderComments = (comments) => {
        if (!comments || comments.length === 0) {
            return (
                <p className="no-comments text-muted">
                    No comments yet. Be the first to add one!
                </p>
            );
        }

        return comments.map((comment) => {
            const parentInfo = getParentCommentInfo(comment, comments);

            return (
                <div key={comment._id} className="comment-item">
                    <div className="comment-header">
                        <div className="comment-author-info">
                            <strong className="comment-author">
                                {getUserFullName(comment.user)}
                            </strong>
                            <span className="comment-date">
                                {formatDateTimeForDisplay(comment.createdAt)}
                                {comment.updatedAt !== comment.createdAt &&
                                    " (edited)"}
                            </span>
                        </div>
                        {isCommentAuthor(comment) && (
                            <div className="comment-menu">
                                <button
                                    className="comment-menu-btn"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowCommentMenu(
                                            showCommentMenu === comment._id
                                                ? null
                                                : comment._id
                                        );
                                    }}
                                >
                                    ⋮
                                </button>
                                {showCommentMenu === comment._id && (
                                    <div
                                        className="comment-menu-dropdown"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                setEditingComment(comment._id);
                                                setEditCommentContent(
                                                    comment.content
                                                );
                                                setShowCommentMenu(null);
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                deleteComment(
                                                    selectedTask._id,
                                                    comment._id
                                                );
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Show reply indicator if this is a reply */}
                    {parentInfo && (
                        <div className="reply-indicator">
                            <span className="reply-to-text">
                                Replying to <strong>{parentInfo.author}</strong>
                                : "{parentInfo.content}"
                            </span>
                        </div>
                    )}

                    {editingComment === comment._id ? (
                        <div className="comment-edit-mode">
                            <textarea
                                value={editCommentContent}
                                onChange={(e) =>
                                    setEditCommentContent(e.target.value)
                                }
                                className="form-input form-textarea"
                                rows="3"
                            />
                            <div className="comment-edit-actions">
                                <button
                                    onClick={() =>
                                        updateComment(
                                            selectedTask._id,
                                            comment._id,
                                            editCommentContent
                                        )
                                    }
                                    disabled={!editCommentContent.trim()}
                                    className="btn btn-primary btn-sm"
                                    type="button"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => {
                                        setEditingComment(null);
                                        setEditCommentContent("");
                                    }}
                                    className="btn btn-outline btn-sm"
                                    type="button"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="comment-content">{comment.content}</p>
                            <div className="comment-actions">
                                <button
                                    onClick={() =>
                                        setReplyingTo(
                                            replyingTo === comment._id
                                                ? null
                                                : comment._id
                                        )
                                    }
                                    className="btn btn-outline btn-sm"
                                    type="button"
                                >
                                    Reply
                                </button>
                            </div>
                            {replyingTo === comment._id && (
                                <div className="reply-form">
                                    <div className="reply-indicator">
                                        <span className="reply-to-text">
                                            Replying to{" "}
                                            <strong>
                                                {getUserFullName(comment.user)}
                                            </strong>
                                        </span>
                                    </div>
                                    <textarea
                                        value={replyContent}
                                        onChange={(e) =>
                                            setReplyContent(e.target.value)
                                        }
                                        placeholder="Write your reply..."
                                        className="form-input form-textarea"
                                        rows="2"
                                    />
                                    <div className="reply-actions">
                                        <button
                                            onClick={() =>
                                                addComment(
                                                    selectedTask._id,
                                                    replyContent,
                                                    comment._id
                                                )
                                            }
                                            disabled={!replyContent.trim()}
                                            className="btn btn-primary btn-sm"
                                            type="button"
                                        >
                                            Post Reply
                                        </button>
                                        <button
                                            onClick={() => {
                                                setReplyingTo(null);
                                                setReplyContent("");
                                            }}
                                            className="btn btn-outline btn-sm"
                                            type="button"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            );
        });
    };

    const filteredTasks = tasks.filter((task) => {
        if (activeTab === "all") return true;
        return task.status === activeTab;
    });

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

    const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

    return (
        <div className="dashboard-container">
            {/* Header Section */}
            <div className="dashboard-header">
                <div className="dashboard-brand">
                    <div>
                        <h1 className="dashboard-title">
                            Welcome back,{" "}
                            <strong>{getUserFullName(currentUser)}</strong>
                            {hasNewUpdates && (
                                <span className="global-notification-badge">
                                    New Updates!
                                </span>
                            )}
                        </h1>
                        <p className="dashboard-welcome">
                            You have {taskStats.total} task
                            {taskStats.total !== 1 ? "s" : ""} in total.
                            {hasNewUpdates &&
                                " You have new updates to review."}
                        </p>
                    </div>
                </div>
                <div className="dashboard-actions">
                    <button
                        onClick={openCreateModal}
                        className="btn btn-primary"
                    >
                        + Create New Task
                    </button>
                </div>
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

            {/* Error Display - Only show non-modal errors here */}
            {error && <div className="error-message">{error}</div>}

            <div className="task-container">
                {/* Tasks List */}
                <div className="tasks-section">
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
                        <div className="tasks-list">
                            {filteredTasks.map((task) => {
                                const hasUpdates = hasNewUpdatesForTask(
                                    task,
                                    currentUser
                                );
                                const updateType = getUpdateType(task);

                                return (
                                    <div
                                        key={task._id}
                                        className={`card task-card ${
                                            hasUpdates ? "has-updates" : ""
                                        }`}
                                    >
                                        <div className="task-header">
                                            <div className="task-content">
                                                <h4 className="task-title">
                                                    {task.title}
                                                    {task.uuid && (
                                                        <span className="reference-id">
                                                            Ref: {task.uuid}
                                                        </span>
                                                    )}
                                                    <span
                                                        className={`status-badge status-${task.status
                                                            .toLowerCase()
                                                            .replace(
                                                                " ",
                                                                "-"
                                                            )}`}
                                                    >
                                                        {task.status}
                                                    </span>
                                                    {hasUpdates && (
                                                        <span className="update-notification-badge">
                                                            {updateType}
                                                        </span>
                                                    )}
                                                </h4>
                                                {task.description && (
                                                    <p className="task-description">
                                                        {task.description}
                                                    </p>
                                                )}
                                                <div className="task-meta">
                                                    <div className="task-meta-item">
                                                        <span>👤</span>
                                                        <span>
                                                            Created by:{" "}
                                                            {getUserFullName(
                                                                task.createdBy
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="task-meta-item">
                                                        <span>📅</span>
                                                        <span>
                                                            {formatDateTimeForDisplay(
                                                                task.deadline
                                                            )}
                                                        </span>
                                                    </div>
                                                    {getAssignedUsersCount(
                                                        task
                                                    ) > 0 && (
                                                        <div className="task-meta-item">
                                                            <span>👥</span>
                                                            <span>
                                                                {getAssignedUsersCount(
                                                                    task
                                                                )}{" "}
                                                                user
                                                                {getAssignedUsersCount(
                                                                    task
                                                                ) !== 1
                                                                    ? "s"
                                                                    : ""}
                                                                :{" "}
                                                                {getAssignedUsersNames(
                                                                    task
                                                                ).join(", ")}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {task.comments &&
                                                        task.comments.length >
                                                            0 && (
                                                            <div className="task-meta-item">
                                                                <span>💬</span>
                                                                <span>
                                                                    {
                                                                        task
                                                                            .comments
                                                                            .length
                                                                    }{" "}
                                                                    comment
                                                                    {task
                                                                        .comments
                                                                        .length !==
                                                                    1
                                                                        ? "s"
                                                                        : ""}
                                                                </span>
                                                            </div>
                                                        )}
                                                </div>
                                            </div>
                                            <div className="task-actions">
                                                {canEditTask(task) && (
                                                    <button
                                                        onClick={() => {
                                                            openEditModal(task);
                                                        }}
                                                        className="btn-update"
                                                    >
                                                        Update
                                                    </button>
                                                )}

                                                {/* View Comments Button */}
                                                <button
                                                    onClick={() => {
                                                        openCommentsModal(task);
                                                    }}
                                                    className="btn btn-outline btn-sm"
                                                >
                                                    View Comments (
                                                    {task.comments
                                                        ? task.comments.length
                                                        : 0}
                                                    )
                                                </button>

                                                {isTaskCreator(task) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedTask(
                                                                task
                                                            );
                                                            setShowDeleteConfirm(
                                                                true
                                                            );
                                                        }}
                                                        className="btn btn-danger btn-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Create/Edit Task Modal */}
            {showTaskModal && (
                <div className="modal-overlay" onClick={closeTaskModal}>
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {isCreating
                                    ? "Create New Task"
                                    : `Edit Task: ${taskTitle}`}
                            </h2>
                            <button
                                className="modal-close"
                                onClick={closeTaskModal}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body" ref={modalBodyRef}>
                            {/* Modal Error Display - Shows at top of modal */}
                            {modalError && (
                                <div className="modal-error-message">
                                    {modalError}
                                </div>
                            )}

                            <form
                                onSubmit={handleFormSubmit}
                                className="task-form"
                                noValidate
                            >
                                <div className="task-detail-section">
                                    <h3>Task Details</h3>

                                    {!isCreating && selectedTask?.uuid && (
                                        <div className="form-group">
                                            <label className="form-label">
                                                Reference ID
                                            </label>
                                            <div className="reference-id-display">
                                                {selectedTask.uuid}
                                            </div>
                                        </div>
                                    )}

                                    {!isCreating && selectedTask && (
                                        <div className="form-group">
                                            <label className="form-label">
                                                Created By
                                            </label>
                                            <div className="reference-id-display">
                                                {getUserFullName(
                                                    selectedTask.createdBy
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="form-group">
                                        <label className="form-label">
                                            Task Title *
                                        </label>
                                        <input
                                            type="text"
                                            value={taskTitle}
                                            onChange={(e) =>
                                                setTaskTitle(e.target.value)
                                            }
                                            placeholder="What needs to be done?"
                                            className="form-input"
                                            disabled={!isCreating}
                                        />
                                        {!isCreating && (
                                            <p className="input-hint">
                                                Title cannot be edited
                                            </p>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Description
                                        </label>
                                        <textarea
                                            value={taskDescription}
                                            onChange={(e) =>
                                                setTaskDescription(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Add a description (optional)"
                                            className="form-input form-textarea"
                                            maxLength={255}
                                            rows="3"
                                            disabled={!isCreating}
                                        />
                                        {!isCreating && (
                                            <p className="input-hint">
                                                Description cannot be edited
                                            </p>
                                        )}
                                    </div>

                                    {/* FIXED: Better aligned form grid */}
                                    <div className="form-grid-aligned">
                                        <div className="form-group">
                                            <label className="form-label">
                                                Deadline *
                                            </label>
                                            <div className="deadline-input-container">
                                                <input
                                                    type="datetime-local"
                                                    value={taskDeadline}
                                                    onChange={(e) =>
                                                        setTaskDeadline(
                                                            e.target.value
                                                        )
                                                    }
                                                    className="form-input datetime-input"
                                                />
                                                <div className="deadline-hint">
                                                    Select date and time
                                                </div>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                Status *
                                            </label>
                                            <select
                                                value={taskStatus}
                                                onChange={(e) =>
                                                    setTaskStatus(
                                                        e.target.value
                                                    )
                                                }
                                                className="form-select status-select-aligned"
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
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            Assign To
                                        </label>
                                        <div className="user-assignment-container">
                                            <div className="selected-users-chips">
                                                {selectedUsers.map((user) => (
                                                    <div
                                                        key={user._id}
                                                        className="user-chip"
                                                    >
                                                        <span className="user-chip-name">
                                                            {getUserFullName(
                                                                user
                                                            )}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeUserFromSelection(
                                                                    user._id
                                                                )
                                                            }
                                                            className="user-chip-remove"
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="user-search-container">
                                                <input
                                                    type="text"
                                                    placeholder="Search users by name or email..."
                                                    value={searchQuery}
                                                    onChange={(e) => {
                                                        setSearchQuery(
                                                            e.target.value
                                                        );
                                                        setShowUserDropdown(
                                                            true
                                                        );
                                                    }}
                                                    onFocus={() =>
                                                        setShowUserDropdown(
                                                            true
                                                        )
                                                    }
                                                    className="form-input user-search-input"
                                                />

                                                {showUserDropdown &&
                                                    filteredUsers.length >
                                                        0 && (
                                                        <div className="user-dropdown">
                                                            {filteredUsers.map(
                                                                (user) => (
                                                                    <div
                                                                        key={
                                                                            user._id
                                                                        }
                                                                        className="user-dropdown-item"
                                                                        onClick={() =>
                                                                            addUserToSelection(
                                                                                user
                                                                            )
                                                                        }
                                                                    >
                                                                        <div className="user-dropdown-info">
                                                                            <div className="user-dropdown-name">
                                                                                {getUserFullName(
                                                                                    user
                                                                                )}
                                                                            </div>
                                                                            <div className="user-dropdown-email">
                                                                                {
                                                                                    user.email
                                                                                }
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                            </div>
                                        </div>
                                        <p className="input-hint">
                                            Click on users to assign them to
                                            this task
                                        </p>
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={loading || updateLoading}
                                    >
                                        {loading || updateLoading ? (
                                            <>
                                                <span className="loading-spinner"></span>
                                                {isCreating
                                                    ? "Creating..."
                                                    : "Updating..."}
                                            </>
                                        ) : isCreating ? (
                                            "Create Task"
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={closeTaskModal}
                                        className="btn btn-outline"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Comments Modal */}
            {showCommentsModal && selectedTask && (
                <div className="modal-overlay" onClick={closeCommentsModal}>
                    <div
                        className="modal-content comments-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">
                                Comments for: {selectedTask.title}
                            </h2>
                            <button
                                className="modal-close"
                                onClick={closeCommentsModal}
                            >
                                ×
                            </button>
                        </div>

                        <div className="modal-body" ref={commentsModalBodyRef}>
                            {/* Modal Error Display - Shows at top of modal */}
                            {modalError && (
                                <div className="modal-error-message">
                                    {modalError}
                                </div>
                            )}

                            <div className="comments-modal-content">
                                <div className="task-info-section">
                                    <h3>Task Information</h3>
                                    <div className="task-info-grid">
                                        <div className="task-info-item">
                                            <strong>Reference ID:</strong>
                                            <span>{selectedTask.uuid}</span>
                                        </div>
                                        <div className="task-info-item">
                                            <strong>Status:</strong>
                                            <span
                                                className={`status-badge status-${selectedTask.status
                                                    .toLowerCase()
                                                    .replace(" ", "-")}`}
                                            >
                                                {selectedTask.status}
                                            </span>
                                        </div>
                                        <div className="task-info-item">
                                            <strong>Deadline:</strong>
                                            <span>
                                                {formatDateTimeForDisplay(
                                                    selectedTask.deadline
                                                )}
                                            </span>
                                        </div>
                                        <div className="task-info-item">
                                            <strong>Created By:</strong>
                                            <span>
                                                {getUserFullName(
                                                    selectedTask.createdBy
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="comments-section-full">
                                    <h3>
                                        Comments (
                                        {selectedTask.comments
                                            ? selectedTask.comments.length
                                            : 0}
                                        )
                                    </h3>

                                    <div className="add-comment-form">
                                        <textarea
                                            value={commentContent}
                                            onChange={(e) =>
                                                setCommentContent(
                                                    e.target.value
                                                )
                                            }
                                            placeholder="Add a comment..."
                                            className="form-input form-textarea"
                                            rows="3"
                                        />
                                        <button
                                            onClick={() =>
                                                addComment(
                                                    selectedTask._id,
                                                    commentContent
                                                )
                                            }
                                            disabled={!commentContent.trim()}
                                            className="btn btn-primary btn-sm"
                                            type="button"
                                            style={{ marginTop: "0.5rem" }}
                                        >
                                            Add Comment
                                        </button>
                                    </div>

                                    <div className="comments-list">
                                        {renderComments(
                                            selectedTask.comments || []
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={closeCommentsModal}
                                className="btn btn-outline"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && selectedTask && (
                <div className="modal-overlay">
                    <div
                        className="modal-content"
                        style={{ maxWidth: "400px" }}
                    >
                        <div className="modal-header">
                            <h2 className="modal-title">Confirm Delete</h2>
                            <button
                                className="modal-close"
                                onClick={() => setShowDeleteConfirm(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>
                                Are you sure you want to delete task "
                                {selectedTask.title}"? This action cannot be
                                undone.
                            </p>
                            <div className="modal-actions">
                                <button
                                    onClick={() => deleteTask(selectedTask._id)}
                                    className="btn btn-danger"
                                >
                                    Yes, Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="btn btn-outline"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
