const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const verifyToken = require("../middleware/auth");

const router = express.Router();

// ---------------------------
// REGISTER new user
// ---------------------------
router.post("/register", async (req, res) => {
    try {
        const { username, email, password, firstName, lastName } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ email }, { username }],
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email or username already exists",
            });
        }

        // Create new user
        const user = new User({
            username,
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        // Return user data without password (fullName will be included via toJSON)
        const userResponse = user.toJSON();

        res.status(201).json({
            token,
            user: userResponse,
        });
    } catch (err) {
        console.error("❌ Registration error:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Failed to create user" });
    }
});

// ---------------------------
// LOGIN user (with username OR email)
// ---------------------------
router.post("/login", async (req, res) => {
    try {
        const { login, password } = req.body;

        if (!login || !password) {
            return res.status(400).json({
                message: "Login identifier and password are required",
            });
        }

        // Check if input looks like an email
        const isEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(
            login
        );

        let user;
        if (isEmail) {
            user = await User.findOne({ email: login.toLowerCase() });
        } else {
            user = await User.findOne({ username: login });
        }

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (!user.isActive) {
            return res.status(400).json({ message: "Account is deactivated" });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
            },
            process.env.JWT_SECRET,
            { expiresIn: "24h" }
        );

        res.json({
            token,
            user: user.toJSON(), // fullName included via toJSON
        });
    } catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ message: "Server error during login" });
    }
});

// ---------------------------
// GET current user profile
// ---------------------------
router.get("/me", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.toJSON()); // fullName included via toJSON
    } catch (err) {
        console.error("❌ Get profile error:", err);
        res.status(500).json({ message: "Failed to fetch user profile" });
    }
});

// ---------------------------
// UPDATE user profile (Enhanced version)
// ---------------------------
router.patch("/profile", verifyToken, async (req, res) => {
    try {
        const { firstName, lastName, email, username } = req.body;

        // Build update data object
        const updateData = {};
        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;

        // Only check for email/username uniqueness if they're being updated
        if (email !== undefined || username !== undefined) {
            const existingUserConditions = { _id: { $ne: req.user.id } };
            const orConditions = [];

            if (email !== undefined) {
                updateData.email = email.toLowerCase();
                orConditions.push({ email: email.toLowerCase() });
            }
            if (username !== undefined) {
                updateData.username = username;
                orConditions.push({ username });
            }

            if (orConditions.length > 0) {
                existingUserConditions.$or = orConditions;

                const existingUser = await User.findOne(existingUserConditions);
                if (existingUser) {
                    return res.status(400).json({
                        message: "Email or username already exists",
                    });
                }
            }
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: "No fields to update",
            });
        }

        const user = await User.findByIdAndUpdate(req.user.id, updateData, {
            new: true,
            runValidators: true,
            context: "query", // This helps with unique validation
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Profile updated successfully",
            user: user.toJSON(), // fullName included via toJSON
        });
    } catch (err) {
        console.error("❌ Update profile error:", err);

        // Handle validation errors
        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map(
                (error) => error.message
            );
            return res.status(400).json({
                message: errors.join(", "),
            });
        }

        // Handle duplicate key errors
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern)[0];
            return res.status(400).json({
                message: `${field} already exists`,
            });
        }

        res.status(500).json({ message: "Failed to update profile" });
    }
});

// ---------------------------
// CHANGE user password
// ---------------------------
router.patch("/change-password", verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: "Current password and new password are required",
            });
        }

        // Get user with password field
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                message: "Current password is incorrect",
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            message: "Password updated successfully",
        });
    } catch (err) {
        console.error("❌ Change password error:", err);

        if (err.name === "ValidationError") {
            const errors = Object.values(err.errors).map(
                (error) => error.message
            );
            return res.status(400).json({
                message: errors.join(", "),
            });
        }

        res.status(500).json({ message: "Failed to change password" });
    }
});

// ---------------------------
// DEACTIVATE user account
// ---------------------------
router.patch("/deactivate", verifyToken, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.user.id,
            { isActive: false },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "Account deactivated successfully",
        });
    } catch (err) {
        console.error("❌ Deactivate account error:", err);
        res.status(500).json({ message: "Failed to deactivate account" });
    }
});

// ---------------------------
// GET all users for assignment dropdown
// ---------------------------
router.get("/users", verifyToken, async (req, res) => {
    try {
        const users = await User.find({ isActive: true })
            .select("username firstName lastName email")
            .sort({ firstName: 1, lastName: 1 });

        // Manually add fullName to each user
        const usersWithFullName = users.map((user) => {
            const userObj = user.toJSON();
            return userObj;
        });

        console.log(
            `📋 Found ${usersWithFullName.length} active users for assignment`
        );

        res.json(usersWithFullName);
    } catch (err) {
        console.error("❌ Get users error:", err);
        res.status(500).json({ message: "Failed to fetch users" });
    }
});

module.exports = router;
