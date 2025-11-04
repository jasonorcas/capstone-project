const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: [
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores",
            ],
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
                "Please enter a valid email",
            ],
        },
        password: {
            type: String,
            required: true,
            minlength: 8,
            validate: {
                validator: function (password) {
                    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
                        password
                    );
                },
                message:
                    "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 symbol",
            },
        },
        firstName: {
            type: String,
            trim: true,
            maxlength: 50,
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: 50,
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

// Hash password before saving
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();

    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    return user;
};

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);
