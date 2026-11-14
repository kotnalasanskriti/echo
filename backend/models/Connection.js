
const mongoose = require("mongoose");

const connectionSchema = new mongoose.Schema({

    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },

    createdAt: {
        type: Date,
        default: Date.now
    },

    respondedAt: {
        type: Date,
        default: null
    }

});

// Prevent duplicate requests in the same direction
connectionSchema.index(
    { requester: 1, recipient: 1 },
    { unique: true }
);

// Prevent users from sending requests to themselves
connectionSchema.pre("validate", function () {
    if (this.requester.equals(this.recipient)) {
        this.invalidate("recipient", "Cannot connect with yourself.");
    }
});

const Connection = mongoose.model("Connection", connectionSchema);

module.exports = Connection;
