
const mongoose = require("mongoose");

const ideaSchema = new mongoose.Schema(
    {
        creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        title: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            default: ""
        },

        industry: {
            type: String,
            default: ""
        },

        problem: {
            type: String,
            default: ""
        },

        solution: {
            type: String,
            default: ""
        },

        description: {
            type: String,
            default: ""
        },

        targetAudience: {
            type: String,
            default: ""
        },

        funding: {
            type: String,
            default: ""
        },

        stage: {
            type: String,
            default: "Idea"
        },

        tags: {
            type: [String],
            default: []
        },

        status: {
            type: String,
            enum: ["In Progress", "Completed", "On Hold"],
            default: "In Progress"
        },

        visibility: {
            type: String,
            enum: ["Private", "Public"],
            default: "Private"
        }
    },
    { timestamps: true }
);

const Idea = mongoose.model("Idea", ideaSchema);

module.exports = Idea;
