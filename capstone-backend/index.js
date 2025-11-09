require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/task");

const app = express();

// ---------------------------
// CORS Configuration
// ---------------------------
app.use(
    cors({
        origin: process.env.FRONTEND_ORIGIN,
        methods: ["GET", "POST", "DELETE", "OPTIONS", "PATCH"],
        credentials: true,
    })
);
app.use(express.json());

// ---------------------------
// Health Check Endpoint
// ---------------------------
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        database:
            mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    });
});

// ---------------------------
// MongoDB Connection
// ---------------------------
const uri = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

mongoose
    .connect(uri)
    .then(() => {
        console.log("✅ Connected to MongoDB Atlas!");

        // ---------------------------
        // Route Configuration
        // ---------------------------
        app.use("/auth", authRoutes);
        app.use("/tasks", taskRoutes);

        // ---------------------------
        // Server Startup
        // ---------------------------
        app.listen(process.env.PORT, () =>
            console.log(`🚀 Server running on port ${process.env.PORT}`)
        );
    })
    .catch((err) => {
        console.error("❌ MongoDB connection failed:", err.message);
    });

// comment
