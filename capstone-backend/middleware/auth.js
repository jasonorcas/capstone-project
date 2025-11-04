const jwt = require("jsonwebtoken");
require("dotenv").config();

// ---------------------------
// Verify JWT Token Middleware
// ---------------------------
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // No header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ message: "Access denied: No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        // Verify JWT using secret from .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // store user data (id, email, etc.)
        next();
    } catch (err) {
        console.error("❌ Token verification failed:", err.message);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}

module.exports = verifyToken;
