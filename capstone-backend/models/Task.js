const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        // Task title (required, max 60 chars)
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 60,
        },

        // Task description (optional, max 255 chars)
        description: {
            type: String,
            trim: true,
            maxlength: 255,
            default: "",
        },

        // Task deadline (required)
        deadline: {
            type: Date,
            required: true,
        },

        // Task status (progress tracking)
        status: {
            type: String,
            enum: ["Pending", "In Progress", "Completed", "Overdue"],
            default: "Pending",
        },

        // Support multiple assigned users
        assignedTo: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        // The creator of the task
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },

        // Enhanced Comments system with reply support
        comments: [
            {
                user: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                content: {
                    type: String,
                    required: true,
                    trim: true,
                    maxlength: 1000,
                },
                parentCommentId: {
                    type: mongoose.Schema.Types.ObjectId,
                    default: null,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
                updatedAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],

        // UUID field
        uuid: {
            type: String,
            unique: true,
            sparse: true,
        },
    },
    { timestamps: true }
);

// Auto-generate UUID before saving
taskSchema.pre("save", async function (next) {
    if (!this.uuid) {
        try {
            // Get the highest existing UUID number
            const lastTask = await mongoose
                .model("Task")
                .findOne({ uuid: { $regex: /^TASK-\d+$/ } })
                .sort({ createdAt: -1 });

            let nextNumber = 1;
            if (lastTask && lastTask.uuid) {
                const lastNumber = parseInt(lastTask.uuid.split("-")[1]);
                nextNumber = isNaN(lastNumber) ? 1 : lastNumber + 1;
            }

            const paddedNumber = String(nextNumber).padStart(6, "0");
            this.uuid = `TASK-${paddedNumber}`;
        } catch (error) {
            console.error("Error generating UUID:", error);
            // Fallback to timestamp-based ID
            const timestamp = Date.now().toString().slice(-6);
            this.uuid = `TASK-${timestamp}`;
        }
    }

    // Auto-check for overdue status
    if (
        this.deadline &&
        this.deadline < new Date() &&
        this.status !== "Completed"
    ) {
        this.status = "Overdue";
    }

    // Update comment updatedAt when comments are modified
    if (this.isModified("comments") && this.comments.length > 0) {
        const now = new Date();
        this.comments.forEach((comment) => {
            if (comment.isModified) {
                comment.updatedAt = now;
            }
        });
    }

    next();
});

// Also check for overdue status when document is retrieved
taskSchema.post("init", function (doc) {
    if (
        doc.deadline &&
        doc.deadline < new Date() &&
        doc.status !== "Completed"
    ) {
        doc.status = "Overdue";
    }
});

// Virtual for getting top-level comments (not replies)
taskSchema.virtual("topLevelComments").get(function () {
    return this.comments.filter((comment) => !comment.parentCommentId);
});

// Method to get replies for a specific comment
taskSchema.methods.getCommentReplies = function (commentId) {
    return this.comments.filter(
        (comment) =>
            comment.parentCommentId &&
            comment.parentCommentId.toString() === commentId.toString()
    );
};

// Index for better comment query performance
taskSchema.index({ "comments.parentCommentId": 1 });
taskSchema.index({ "comments.createdAt": -1 });

module.exports = mongoose.model("Task", taskSchema);
