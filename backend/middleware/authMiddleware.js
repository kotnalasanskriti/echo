
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const protect = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
            message: "Not authorized, no token"
        });
    }

    try {
        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
            return res.status(401).json({
                message: "Invalid authentication token"
            });
        }

        // Verify that the user still exists in MongoDB
        const user = await User.findById(decoded.id).select("_id role");

        if (!user) {
            return res.status(401).json({
                message: "User account no longer exists"
            });
        }

        // Use the current database role, not the potentially stale token role
        req.user = {
            id: user._id.toString(),
            role: user.role
        };

        next();

    } catch (error) {
        if (
            error.name === "JsonWebTokenError" ||
            error.name === "TokenExpiredError"
        ) {
            return res.status(401).json({
                message: "Invalid or expired token"
            });
        }

        next(error);
    }
};

module.exports = protect;
