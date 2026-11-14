
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const { initializeGridFS } = require("./config/gridfs");

// Routes
const userRoutes = require("./routes/userRoutes");
const innovatorProfileRoutes = require("./routes/innovatorProfileRoutes");
const ideaRoutes = require("./routes/ideaRoutes");
const messageRoutes = require("./routes/messageRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const interestRoutes = require("./routes/interestRoutes");

const app = express();

// CORS configuration
const allowedOrigins = (
    process.env.CLIENT_ORIGIN ||
    "http://localhost:5500,http://127.0.0.1:5500"
)
    .split(",")
    .map(origin => origin.trim());

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        }
    })
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/", (req, res) => {
    res.json({
        message: "Welcome to ECHO Backend!",
        status: "Running"
    });
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "OK",
        database: "Connected"
    });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/innovator", innovatorProfileRoutes);
app.use("/api/ideas", ideaRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/interests", interestRoutes);

// 404 handler (must remain after all API routes)
app.use((req, res) => {
    res.status(404).json({
        message: "API route not found"
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Server error:", err.message);

    res.status(err.status || 500).json({
        message: err.message || "Internal server error"
    });
});

// Start server only after MongoDB and GridFS are ready
const startServer = async () => {
    try {
        await connectDB();

        initializeGridFS();

        const PORT = process.env.PORT || 5000;

        app.listen(PORT, () => {
            console.log(`ECHO server running on port ${PORT}`);
        });

    } catch (error) {
        console.error("ECHO startup failed:", error.message);
        process.exit(1);
    }
};

startServer();
