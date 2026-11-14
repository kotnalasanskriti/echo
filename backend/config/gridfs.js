
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

let gridfsBucket;

const initializeGridFS = () => {

    const db = mongoose.connection.db;

    if (!db) {
        throw new Error("MongoDB connection is not ready.");
    }

    gridfsBucket = new GridFSBucket(db, {
        bucketName: "profilePhotos"
    });

    console.log("GridFS initialized successfully!");
};

const getGridFSBucket = () => {

    if (!gridfsBucket) {
        throw new Error("GridFS has not been initialized.");
    }

    return gridfsBucket;
};

module.exports = {
    initializeGridFS,
    getGridFSBucket
};
