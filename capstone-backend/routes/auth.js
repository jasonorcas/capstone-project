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

        // Return user data without password
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
            user: user.toJSON(),
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

        res.json(user.toJSON());
    } catch (err) {
        console.error("❌ Get profile error:", err);
        res.status(500).json({ message: "Failed to fetch user profile" });
    }
});

// ---------------------------
// UPDATE user profile
// ---------------------------
router.patch("/profile", verifyToken, async (req, res) => {
    try {
        const { firstName, lastName } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { firstName, lastName },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user.toJSON());
    } catch (err) {
        console.error("❌ Update profile error:", err);
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        res.status(500).json({ message: "Failed to update profile" });
    }
});

module.exports = router;
