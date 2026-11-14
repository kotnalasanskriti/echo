
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// REGISTER USER

const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        // Check role
        if (!["innovator", "investor"].includes(role)) {
            return res.status(400).json({
                message: "Invalid user role"
            });
        }

        // Check existing user
        const existingUser = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already registered"
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            role
        });

        // Generate JWT AFTER creating the user
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        // Send response
        res.status(201).json({
            message: "Registration successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

// LOGIN USER
const loginUser = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password || !role) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim(),
            role
        });

        if (!user) {
            return res.status(401).json({
                message: "Invalid email, password or role"
            });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid email, password or role"
            });
        }

        // Generate token
        const token = jwt.sign(
            {
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(200).json({
            message: "Login successful!",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};


const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            message: "Profile fetched successfully",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const { name, email, interest, about } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                email,
                interest,
                about
            },
            {
                new: true,
                runValidators: true
            }
        ).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found."
            });
        }

        res.status(200).json({
            message: "Profile updated successfully.",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
};
module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile
};