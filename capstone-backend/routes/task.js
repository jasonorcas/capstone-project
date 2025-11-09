const express = require("express");
const Task = require("../models/Task");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// Protect all routes with JWT middleware
router.use(verifyToken);

// ---------------------------
// CREATE a new task
// ---------------------------
router.post("/", async (req, res) => {
    try {
        const { title, description, deadline, assignedTo } = req.body;

        // Validate required fields
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Task title is required" });
        }

        if (!deadline) {
            return res.status(400).json({ message: "Deadline is required" });
        }

        // Validate deadline is in the future
        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return res
                .status(400)
                .json({ message: "Deadline must be in the future" });
        }

        let assignedUserIds = [];

        // Handle multiple user assignment by username/email
        if (assignedTo && Array.isArray(assignedTo) && assignedTo.length > 0) {
            for (const assignee of assignedTo) {
                if (assignee && assignee.trim() !== "") {
                    // Search by username or email
                    const userExists = await User.findOne({
                        $or: [
                            { username: assignee.trim() },
                            { email: assignee.trim().toLowerCase() },
                        ],
                    });

                    if (!userExists) {
                        return res.status(400).json({
                            message: `User not found: ${assignee}`,
                        });
                    }
                    assignedUserIds.push(userExists._id);
                }
            }
        }

        // Create the task
        const task = await Task.create({
            title: title.trim(),
            description: description ? description.trim() : "",
            deadline: deadlineDate,
            assignedTo: assignedUserIds,
            createdBy: req.user.id,
        });

        // Populate the task with user details - INCLUDING fullName
        const populatedTask = await Task.findById(task._id)
            .populate(
                "assignedTo",
                "username firstName lastName email fullName"
            )
            .populate("createdBy", "username firstName lastName email fullName")
            .populate(
                "comments.user",
                "username firstName lastName email fullName"
            );

        console.log("✅ Task created with populated creator:", {
            taskId: populatedTask._id,
            creatorId: populatedTask.createdBy?._id,
            creatorName: populatedTask.createdBy?.fullName,
            hasCreator: !!populatedTask.createdBy,
        });

        res.status(201).json(populatedTask);
    } catch (err) {
        console.error("❌ Error creating task:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Failed to create task" });
    }
});

// ---------------------------
// READ all tasks for logged-in user - INCLUDING fullName
// ---------------------------
router.get("/", async (req, res) => {
    try {
        console.log("🔍 Fetching tasks for user:", req.user.id);

        const tasks = await Task.find({
            $or: [
                { createdBy: req.user.id },
                { assignedTo: { $in: [req.user.id] } },
            ],
        })
            .populate({
                path: "assignedTo",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "createdBy",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "comments.user",
                select: "username firstName lastName email fullName",
            })
            .sort({ createdAt: -1 });

        // Debug: Check population results
        console.log(`📋 Found ${tasks.length} tasks`);
        tasks.forEach((task, index) => {
            console.log(`   Task ${index + 1}: "${task.title}"`);
            console.log(
                `     - Created by:`,
                task.createdBy
                    ? {
                          id: task.createdBy._id,
                          name: task.createdBy.fullName,
                          email: task.createdBy.email,
                      }
                    : "NULL/MISSING"
            );
            console.log(
                `     - Assigned to: ${task.assignedTo?.length || 0} users`
            );
            console.log(`     - Comments: ${task.comments?.length || 0}`);
        });

        res.json(tasks);
    } catch (err) {
        console.error("❌ Error fetching tasks:", err);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

// ---------------------------
// UPDATE a task - INCLUDING fullName
// ---------------------------
router.patch("/:id", async (req, res) => {
    try {
        const { title, description, deadline, status, assignedTo } = req.body;

        console.log("🔄 Updating task:", req.params.id);

        // Find the task first to check permissions
        const existingTask = await Task.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user.id },
                { assignedTo: { $in: [req.user.id] } },
            ],
        });

        if (!existingTask) {
            return res.status(404).json({
                message: "Task not found or not authorized to modify",
            });
        }

        // Check if user is owner or assigned
        const isOwner = existingTask.createdBy.toString() === req.user.id;
        const isAssigned = existingTask.assignedTo.some(
            (user) => user.toString() === req.user.id
        );

        // Build update object
        const updateData = {};

        // Title update - only owners can update
        if (title !== undefined) {
            if (!isOwner) {
                return res.status(403).json({
                    message: "Only task owner can update title",
                });
            }
            if (!title.trim()) {
                return res
                    .status(400)
                    .json({ message: "Task title cannot be empty" });
            }
            updateData.title = title.trim();
        }

        // Description update - only owners can update
        if (description !== undefined) {
            if (!isOwner) {
                return res.status(403).json({
                    message: "Only task owner can update description",
                });
            }
            updateData.description = description.trim();
        }

        // Status update - both owners and assigned users can update
        if (status !== undefined) {
            if (
                !["Pending", "In Progress", "Completed", "Overdue"].includes(
                    status
                )
            ) {
                return res.status(400).json({
                    message:
                        "Valid status is required: Pending, In Progress, Completed, or Overdue",
                });
            }
            updateData.status = status;
        }

        // AssignedTo update - only owners can update
        if (assignedTo !== undefined) {
            if (!isOwner) {
                return res.status(403).json({
                    message: "Only task owner can update assigned users",
                });
            }

            let assignedUserIds = [];

            if (Array.isArray(assignedTo) && assignedTo.length > 0) {
                for (const assignee of assignedTo) {
                    if (assignee && assignee.trim() !== "") {
                        // Search by username or email
                        const userExists = await User.findOne({
                            $or: [
                                { username: assignee.trim() },
                                { email: assignee.trim().toLowerCase() },
                            ],
                        });

                        if (!userExists) {
                            return res.status(400).json({
                                message: `User not found: ${assignee}`,
                            });
                        }
                        assignedUserIds.push(userExists._id);
                    }
                }
            }
            updateData.assignedTo = assignedUserIds;
        }

        // Deadline update - only owners can update
        if (deadline !== undefined) {
            if (!isOwner) {
                return res.status(403).json({
                    message: "Only task owner can update deadline",
                });
            }

            const newDeadline = new Date(deadline);
            const now = new Date();
            if (newDeadline <= new Date(now.getTime() - 60000)) {
                return res
                    .status(400)
                    .json({ message: "Deadline must be in the future" });
            }
            updateData.deadline = newDeadline;
        }

        // Check if there are any updates
        if (Object.keys(updateData).length === 0) {
            return res
                .status(400)
                .json({ message: "No valid fields to update" });
        }

        const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate({
                path: "assignedTo",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "createdBy",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "comments.user",
                select: "username firstName lastName email fullName",
            });

        console.log("✅ Task updated with populated creator:", {
            taskId: task._id,
            creator: task.createdBy
                ? {
                      id: task.createdBy._id,
                      name: task.createdBy.fullName,
                  }
                : "MISSING",
        });

        res.json(task);
    } catch (err) {
        console.error("❌ Error updating task:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID format" });
        }
        res.status(500).json({ message: "Failed to update task" });
    }
});

// ---------------------------
// ADD COMMENT to task - UPDATED for reply support
// ---------------------------
router.post("/:id/comments", async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;

        if (!content || !content.trim()) {
            return res
                .status(400)
                .json({ message: "Comment content is required" });
        }

        console.log("💬 Adding comment to task:", req.params.id, {
            parentCommentId,
        });

        // Find the task first to check permissions
        const existingTask = await Task.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user.id },
                { assignedTo: { $in: [req.user.id] } },
            ],
        });

        if (!existingTask) {
            return res
                .status(404)
                .json({ message: "Task not found or not authorized" });
        }

        // Validate parent comment exists if provided
        if (parentCommentId) {
            const parentComment = existingTask.comments.id(parentCommentId);
            if (!parentComment) {
                return res.status(400).json({
                    message: "Parent comment not found",
                });
            }
        }

        const newComment = {
            user: req.user.id,
            content: content.trim(),
            parentCommentId: parentCommentId || null,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: newComment } },
            { new: true, runValidators: true }
        )
            .populate({
                path: "assignedTo",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "createdBy",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "comments.user",
                select: "username firstName lastName email fullName",
            });

        console.log(
            "✅ Comment added. Latest comments:",
            task.comments.map((c) => ({
                user: c.user?.fullName,
                content: c.content,
                parentCommentId: c.parentCommentId,
            }))
        );

        res.json(task);
    } catch (err) {
        console.error("❌ Error adding comment:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID format" });
        }
        res.status(500).json({ message: "Failed to add comment" });
    }
});

// ---------------------------
// UPDATE COMMENT in task - UPDATED for nested comments
// ---------------------------
router.patch("/:taskId/comments/:commentId", async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res
                .status(400)
                .json({ message: "Comment content is required" });
        }

        console.log("✏️ Updating comment:", req.params.commentId);

        // Find the task and comment
        const task = await Task.findOne({
            _id: req.params.taskId,
            "comments._id": req.params.commentId,
            "comments.user": req.user.id, // Only comment author can update
        });

        if (!task) {
            return res.status(404).json({
                message: "Comment not found or not authorized to update",
            });
        }

        // Update the comment
        const updatedTask = await Task.findOneAndUpdate(
            {
                _id: req.params.taskId,
                "comments._id": req.params.commentId,
            },
            {
                $set: {
                    "comments.$.content": content.trim(),
                    "comments.$.updatedAt": new Date(),
                },
            },
            { new: true, runValidators: true }
        )
            .populate({
                path: "assignedTo",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "createdBy",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "comments.user",
                select: "username firstName lastName email fullName",
            });

        res.json(updatedTask);
    } catch (err) {
        console.error("❌ Error updating comment:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        res.status(500).json({ message: "Failed to update comment" });
    }
});

// ---------------------------
// DELETE COMMENT from task - UPDATED for nested comments
// ---------------------------
router.delete("/:taskId/comments/:commentId", async (req, res) => {
    try {
        console.log("🗑️ Deleting comment:", req.params.commentId);

        // Find the task and comment
        const task = await Task.findOne({
            _id: req.params.taskId,
            "comments._id": req.params.commentId,
            "comments.user": req.user.id, // Only comment author can delete
        });

        if (!task) {
            return res.status(404).json({
                message: "Comment not found or not authorized to delete",
            });
        }

        // Check if this comment has replies
        const commentToDelete = task.comments.id(req.params.commentId);
        const hasReplies = task.comments.some(
            (comment) =>
                comment.parentCommentId &&
                comment.parentCommentId.toString() === req.params.commentId
        );

        if (hasReplies) {
            return res.status(400).json({
                message:
                    "Cannot delete comment that has replies. Delete the replies first.",
            });
        }

        // Remove the comment
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.taskId,
            {
                $pull: { comments: { _id: req.params.commentId } },
            },
            { new: true, runValidators: true }
        )
            .populate({
                path: "assignedTo",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "createdBy",
                select: "username firstName lastName email fullName",
            })
            .populate({
                path: "comments.user",
                select: "username firstName lastName email fullName",
            });

        res.json(updatedTask);
    } catch (err) {
        console.error("❌ Error deleting comment:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        res.status(500).json({ message: "Failed to delete comment" });
    }
});

// ---------------------------
// GET comment replies for a specific comment
// ---------------------------
router.get("/:taskId/comments/:commentId/replies", async (req, res) => {
    try {
        console.log("📥 Getting replies for comment:", req.params.commentId);

        const task = await Task.findOne({
            _id: req.params.taskId,
            $or: [
                { createdBy: req.user.id },
                { assignedTo: { $in: [req.user.id] } },
            ],
        }).populate({
            path: "comments.user",
            select: "username firstName lastName email fullName",
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found or not authorized",
            });
        }

        const replies = task.comments.filter(
            (comment) =>
                comment.parentCommentId &&
                comment.parentCommentId.toString() === req.params.commentId
        );

        console.log(
            `📋 Found ${replies.length} replies for comment ${req.params.commentId}`
        );

        res.json(replies);
    } catch (err) {
        console.error("❌ Error fetching comment replies:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid ID format" });
        }
        res.status(500).json({ message: "Failed to fetch comment replies" });
    }
});

// ---------------------------
// DELETE a task
// ---------------------------
router.delete("/:id", async (req, res) => {
    try {
        console.log("🗑️ Deleting task:", req.params.id);

        const deleted = await Task.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id,
        });

        if (!deleted) {
            return res
                .status(404)
                .json({ message: "Task not found or not authorized" });
        }

        console.log("✅ Task deleted:", req.params.id);
        res.sendStatus(204);
    } catch (err) {
        console.error("❌ Error deleting task:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID format" });
        }
        res.status(500).json({ message: "Failed to delete task" });
    }
});

module.exports = router;
