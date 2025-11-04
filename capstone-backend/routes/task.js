const express = require("express");
const Task = require("../models/Task");
const verifyToken = require("../middleware/auth");
const mongoose = require("mongoose");

const router = express.Router();

// Protect all routes with JWT middleware
router.use(verifyToken);

// ---------------------------
// CREATE a new task
// ---------------------------
router.post("/", async (req, res) => {
    try {
        const { title, description, deadline, assignedTo } = req.body;

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

        // Validate assignedTo if provided
        if (assignedTo && assignedTo.trim() !== "") {
            if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
                return res
                    .status(400)
                    .json({ message: "Invalid user ID format" });
            }

            const userExists = await mongoose
                .model("User")
                .findById(assignedTo);
            if (!userExists) {
                return res
                    .status(400)
                    .json({ message: "Assigned user not found" });
            }
        }

        const task = await Task.create({
            title: title.trim(),
            description: description ? description.trim() : "",
            deadline: deadlineDate,
            assignedTo:
                assignedTo && assignedTo.trim() !== "" ? assignedTo : null,
            createdBy: req.user.id,
        });

        await task.populate("assignedTo", "username firstName lastName email");
        await task.populate("createdBy", "username firstName lastName email");

        res.status(201).json(task);
    } catch (err) {
        console.error("❌ Error creating task:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Failed to create task" });
    }
});

// ---------------------------
// READ all tasks for logged-in user
// - You can see tasks you created OR that are assigned to you
// ---------------------------
router.get("/", async (req, res) => {
    try {
        const tasks = await Task.find({
            $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
        })
            .populate("assignedTo", "username firstName lastName email")
            .populate("createdBy", "username firstName lastName email")
            .sort({ createdAt: -1 });

        res.json(tasks);
    } catch (err) {
        console.error("❌ Error fetching tasks:", err);
        res.status(500).json({ message: "Failed to fetch tasks" });
    }
});

// ---------------------------
// GET single task by ID
// ---------------------------
router.get("/:id", async (req, res) => {
    try {
        const task = await Task.findOne({
            _id: req.params.id,
            $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
        })
            .populate("assignedTo", "username firstName lastName email")
            .populate("createdBy", "username firstName lastName email");

        if (!task) {
            return res
                .status(404)
                .json({ message: "Task not found or not authorized" });
        }

        res.json(task);
    } catch (err) {
        console.error("❌ Error fetching task:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID format" });
        }
        res.status(500).json({ message: "Failed to fetch task" });
    }
});

// ---------------------------
// UPDATE a task
// - Only the creator can edit the task
// ---------------------------
router.patch("/:id", async (req, res) => {
    try {
        const { title, description, deadline, status, assignedTo } = req.body;

        // Find the task first to check ownership
        const existingTask = await Task.findOne({
            _id: req.params.id,
            createdBy: req.user.id,
        });

        if (!existingTask) {
            return res
                .status(404)
                .json({ message: "Task not found or not authorized" });
        }

        // Build update object
        const updateData = {};
        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined)
            updateData.description = description.trim();
        if (status !== undefined) updateData.status = status;

        // Handle assignedTo separately for validation
        if (assignedTo !== undefined) {
            if (assignedTo && assignedTo.trim() !== "") {
                if (!mongoose.Types.ObjectId.isValid(assignedTo)) {
                    return res
                        .status(400)
                        .json({ message: "Invalid user ID format" });
                }

                const userExists = await mongoose
                    .model("User")
                    .findById(assignedTo);
                if (!userExists) {
                    return res
                        .status(400)
                        .json({ message: "Assigned user not found" });
                }
                updateData.assignedTo = assignedTo;
            } else {
                updateData.assignedTo = null;
            }
        }

        // Handle deadline separately for validation
        if (deadline !== undefined) {
            const newDeadline = new Date(deadline);
            if (newDeadline <= new Date()) {
                return res
                    .status(400)
                    .json({ message: "Deadline must be in the future" });
            }
            updateData.deadline = newDeadline;
        }

        const task = await Task.findByIdAndUpdate(req.params.id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("assignedTo", "username firstName lastName email")
            .populate("createdBy", "username firstName lastName email");

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
// UPDATE task status only
// - Both creator and assigned user can update status
// ---------------------------
router.patch("/:id/status", async (req, res) => {
    try {
        const { status } = req.body;

        if (
            !status ||
            !["Pending", "In Progress", "Completed", "Overdue"].includes(status)
        ) {
            return res.status(400).json({
                message:
                    "Valid status is required: Pending, In Progress, Completed, or Overdue",
            });
        }

        // Find the task first to check permissions
        const existingTask = await Task.findOne({
            _id: req.params.id,
            $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
        });

        if (!existingTask) {
            return res
                .status(404)
                .json({ message: "Task not found or not authorized" });
        }

        // Prevent setting completed tasks to overdue
        if (existingTask.status === "Completed" && status === "Overdue") {
            return res
                .status(400)
                .json({
                    message: "Completed tasks cannot be marked as overdue",
                });
        }

        const task = await Task.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        )
            .populate("assignedTo", "username firstName lastName email")
            .populate("createdBy", "username firstName lastName email");

        res.json(task);
    } catch (err) {
        console.error("❌ Error updating task status:", err);
        if (err.name === "CastError") {
            return res.status(400).json({ message: "Invalid task ID format" });
        }
        res.status(500).json({ message: "Failed to update task status" });
    }
});

// ---------------------------
// DELETE a task
// - Only the creator can delete the task
// ---------------------------
router.delete("/:id", async (req, res) => {
    try {
        const deleted = await Task.findOneAndDelete({
            _id: req.params.id,
            createdBy: req.user.id,
        });

        if (!deleted) {
            return res
                .status(404)
                .json({ message: "Task not found or not authorized" });
        }

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
