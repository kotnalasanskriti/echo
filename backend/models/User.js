
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: ["innovator", "investor"],
        required: true
    },
interest: {
    type: String,
    default: ""
},
about: {
    type: String,
    default: ""
},

    createdAt: {
        type: Date,
        default: Date.now
    }

});

const User = mongoose.model("User", userSchema);

module.exports = User;
