
const express = require("express");
const router = express.Router();

const protect = require("../middleware/authMiddleware");

const {
    getConversations,
    openConversation,
    getMessages,
    sendMessage,
    markMessagesRead
} = require("../controllers/messageController");

router.get("/conversations", protect, getConversations);

router.post("/conversations/:userId", protect, openConversation);

router.get("/:conversationId", protect, getMessages);

router.post("/:conversationId", protect, sendMessage);

router.patch("/:conversationId/read", protect, markMessagesRead);

module.exports = router;
