
const mongoose = require("mongoose");

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Connection = require("../models/Connection");
const User = require("../models/User");

// Check whether two users have an accepted connection
const areConnected = async (user1, user2) => {
    const connection = await Connection.findOne({
        status: "accepted",
        $or: [
            { requester: user1, recipient: user2 },
            { requester: user2, recipient: user1 }
        ]
    });

    return !!connection;
};

// Generate a consistent key for both participants
const getParticipantKey = (user1, user2) => {
    return [user1.toString(), user2.toString()].sort().join("_");
};


// GET ALL CONVERSATIONS
const getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.user.id
        })
            .populate("participants", "name email role")
            .sort({ lastMessageAt: -1 });

        res.status(200).json(conversations);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// OPEN OR CREATE A CONVERSATION
const openConversation = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (userId === req.user.id) {
            return res.status(400).json({
                message: "Cannot start a conversation with yourself"
            });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const connected = await areConnected(req.user.id, userId);

        if (!connected) {
            return res.status(403).json({
                message: "You can only message connected users"
            });
        }

        const participantKey = getParticipantKey(req.user.id, userId);

        const conversation = await Conversation.findOneAndUpdate(
            { participantKey },
            {
                $setOnInsert: {
                    participants: [req.user.id, userId],
                    participantKey
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        ).populate("participants", "name email role");

        res.status(200).json(conversation);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// GET MESSAGES OF A CONVERSATION
const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: "Invalid conversation ID"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found"
            });
        }

        const messages = await Message.find({
            conversation: conversationId
        })
            .populate("sender", "name role")
            .populate("recipient", "name role")
            .sort({ createdAt: 1 });

        res.status(200).json(messages);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// SEND MESSAGE
const sendMessage = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: "Invalid conversation ID"
            });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({
                message: "Message cannot be empty"
            });
        }

        if (content.length > 5000) {
            return res.status(400).json({
                message: "Message cannot exceed 5000 characters"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found"
            });
        }

        const recipientId = conversation.participants.find(
            id => id.toString() !== req.user.id
        );

        if (!recipientId) {
            return res.status(400).json({
                message: "Invalid conversation participants"
            });
        }

        const connected = await areConnected(req.user.id, recipientId);

        if (!connected) {
            return res.status(403).json({
                message: "You are no longer connected to this user"
            });
        }

        const message = await Message.create({
            conversation: conversationId,
            sender: req.user.id,
            recipient: recipientId,
            content: content.trim()
        });

        conversation.lastMessage = content.trim();
        conversation.lastMessageAt = message.createdAt;

        await conversation.save();

        const populatedMessage = await Message.findById(message._id)
            .populate("sender", "name role")
            .populate("recipient", "name role");

        res.status(201).json({
            message: "Message sent successfully",
            data: populatedMessage
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// MARK MESSAGES AS READ
const markMessagesRead = async (req, res) => {
    try {
        const { conversationId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({
                message: "Invalid conversation ID"
            });
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.user.id
        });

        if (!conversation) {
            return res.status(404).json({
                message: "Conversation not found"
            });
        }

        await Message.updateMany(
            {
                conversation: conversationId,
                recipient: req.user.id,
                read: false
            },
            {
                $set: { read: true }
            }
        );

        res.status(200).json({
            message: "Messages marked as read"
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = {
    getConversations,
    openConversation,
    getMessages,
    sendMessage,
    markMessagesRead
};
