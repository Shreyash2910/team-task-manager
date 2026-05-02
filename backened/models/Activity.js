const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true
    },
    action: {
        type: String, // e.g., "created a task", "updated status to Done"
        required: true
    },
    taskTitle: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', ActivitySchema);