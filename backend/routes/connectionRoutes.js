
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getUsers,
    sendConnectionRequest,
    respondToRequest,
    getMyConnections
} = require("../controllers/connectionController");

router.get("/users", protect, getUsers);

router.get("/", protect, getMyConnections);

router.post("/request/:userId", protect, sendConnectionRequest);

router.patch("/request/:requestId", protect, respondToRequest);

module.exports = router;