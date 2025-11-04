const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
    {
        // MongoDB internal ObjectId
        id: {
            type: mongoose.Schema.Types.ObjectId,
            auto: true,
        },

        // Public-facing UUID (e.g., TASK-000001)
        uuid: {
            type: String,
            unique: true,
            index: true,
            immutable: true,
        },

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

        // Optional assigned user (who the task is given to)
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        // The creator of the task
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            immutable: true,
        },
    },
    { timestamps: true }
);

// Auto-generate the UUID before saving
taskSchema.pre("save", async function (next) {
    if (!this.uuid) {
        try {
            // Use a more reliable method to generate sequential UUID
            const lastTask = await mongoose
                .model("Task")
                .findOne()
                .sort({ createdAt: -1 });

            const nextNumber = lastTask
                ? parseInt(lastTask.uuid.split("-")[1]) + 1
                : 1;
            const paddedNumber = String(nextNumber).padStart(6, "0");
            this.uuid = `TASK-${paddedNumber}`;
        } catch (error) {
            // Fallback if there's an error
            const randomNum = Math.floor(Math.random() * 1000000);
            this.uuid = `TASK-${String(randomNum).padStart(6, "0")}`;
        }
    }

    // Automatically mark overdue if deadline has passed
    if (
        this.deadline &&
        this.deadline < new Date() &&
        this.status !== "Completed"
    ) {
        this.status = "Overdue";
    }

    next();
});

// Also check for overdue status whenever document is retrieved
taskSchema.post("init", function (doc) {
    if (
        doc.deadline &&
        doc.deadline < new Date() &&
        doc.status !== "Completed"
    ) {
        doc.status = "Overdue";
    }
});

module.exports = mongoose.model("Task", taskSchema);
