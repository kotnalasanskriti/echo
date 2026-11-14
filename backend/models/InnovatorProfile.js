
const mongoose = require("mongoose");

const innovatorProfileSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },

        name: {
            type: String,
            trim: true
        },

        email: {
            type: String,
            lowercase: true,
            trim: true
        },
     education: {
    type: String,
    default: ""
},
        location: String,
        introduction: String,

        college: String,
        degree: String,
        graduationYear: String,
        experience: String,

        skills: {
            type: [String],
            default: []
        },

        interests: String,

        startupName: String,
        industry: String,
        startupStage: String,
        ideaDescription: String,
// Stores the MongoDB GridFS file ID for the profile photo.
        profilePhoto: {
            type: String,
            default: ""
        },

        currentStep: {
            type: Number,
            default: 1
        },

        isCompleted: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }

);

const InnovatorProfile = mongoose.model(
    "InnovatorProfile",
    innovatorProfileSchema
);

module.exports = InnovatorProfile;
