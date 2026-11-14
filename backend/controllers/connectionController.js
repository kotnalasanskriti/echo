
const mongoose = require("mongoose");
const User = require("../models/User");
const Connection = require("../models/Connection");

// DISCOVER USERS
const getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;

        const query = {
            _id: { $ne: req.user.id }
        };

        if (role && ["innovator", "investor"].includes(role)) {
            query.role = role;
        }

        if (search && search.trim()) {
            const safeSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

            query.name = {
                $regex: safeSearch,
                $options: "i"
            };
        }

        const users = await User.find(query)
            .select("_id name email role")
            .limit(50)
            .sort({ name: 1 });

        res.status(200).json(users);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// SEND CONNECTION REQUEST
const sendConnectionRequest = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
                message: "Invalid user ID"
            });
        }

        if (userId === req.user.id) {
            return res.status(400).json({
                message: "You cannot connect with yourself"
            });
        }

        const recipient = await User.findById(userId);

        if (!recipient) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const existingRequest = await Connection.findOne({
            requester: req.user.id,
            recipient: userId
        });

        if (existingRequest) {
            if (existingRequest.status === "accepted") {
                return res.status(409).json({
                    message: "You are already connected"
                });
            }

            if (existingRequest.status === "pending") {
                return res.status(409).json({
                    message: "Connection request already sent"
                });
            }

            // Allow sending the request again if previously rejected
            existingRequest.status = "pending";
            existingRequest.createdAt = new Date();
            existingRequest.respondedAt = null;

            await existingRequest.save();

            return res.status(200).json({
                message: "Connection request sent",
                connection: existingRequest
            });
        }

        const reverseRequest = await Connection.findOne({
            requester: userId,
            recipient: req.user.id,
            status: "pending"
        });

        if (reverseRequest) {
            return res.status(409).json({
                message: "This user has already sent you a connection request"
            });
        }

        const connection = await Connection.create({
            requester: req.user.id,
            recipient: userId
        });

        res.status(201).json({
            message: "Connection request sent",
            connection
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ACCEPT OR REJECT CONNECTION REQUEST
const respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return res.status(400).json({
                message: "Invalid request ID"
            });
        }

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                message: "Status must be accepted or rejected"
            });
        }

        const request = await Connection.findOne({
            _id: requestId,
            recipient: req.user.id,
            status: "pending"
        });

        if (!request) {
            return res.status(404).json({
                message: "Pending connection request not found"
            });
        }

        request.status = status;
        request.respondedAt = new Date();

        await request.save();

        res.status(200).json({
            message: `Connection request ${status}`,
            connection: request
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET CONNECTIONS AND REQUESTS
const getMyConnections = async (req, res) => {
    try {
        const userId = req.user.id;

        const [connections, receivedRequests, sentRequests] =
            await Promise.all([

                Connection.find({
                    $or: [
                        { requester: userId },
                        { recipient: userId }
                    ],
                    status: "accepted"
                })
                    .populate("requester", "name email role")
                    .populate("recipient", "name email role")
                    .sort({ respondedAt: -1 }),

                Connection.find({
                    recipient: userId,
                    status: "pending"
                })
                    .populate("requester", "name email role")
                    .sort({ createdAt: -1 }),

                Connection.find({
                    requester: userId,
                    status: "pending"
                })
                    .populate("recipient", "name email role")
                    .sort({ createdAt: -1 })
            ]);

        res.status(200).json({
            connections,
            receivedRequests,
            sentRequests
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getUsers,
    sendConnectionRequest,
    respondToRequest,
    getMyConnections
};