
const mongoose = require("mongoose");

const interestSchema = new mongoose.Schema(
    {
        investor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        idea: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Idea",
            required: true
        }
    },
    { timestamps: true }
);

// Prevent the same investor from saving an idea twice
interestSchema.index(
    { investor: 1, idea: 1 },
    { unique: true }
);

module.exports = mongoose.model("Interest", interestSchema);
