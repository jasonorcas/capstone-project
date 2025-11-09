const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            trim: true,
            minlength: [3, "Username must be at least 3 characters"],
            maxlength: [30, "Username cannot exceed 30 characters"],
            match: [
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores",
            ],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
                "Please enter a valid email address",
            ],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [8, "Password must be at least 8 characters long"],
            validate: {
                validator: function (password) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
                        password
                    );
                },
                message:
                    "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol",
            },
        },
        firstName: {
            type: String,
            trim: true,
            maxlength: [50, "First name cannot exceed 50 characters"],
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: [50, "Last name cannot exceed 50 characters"],
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Virtual full name getter
userSchema.virtual("fullName").get(function () {
    return (
        [this.firstName, this.lastName].filter(Boolean).join(" ") ||
        this.username
    );
});

// Password hashing middleware
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Hide password in JSON
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Indexes for optimization
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
