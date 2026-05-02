const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "Task title is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['Todo', 'In-Progress', 'Done'],
        default: 'Todo'
    },
    // NEW: Priority field for Dashboard Hero tags
    priority: {
        type: String,
        enum: ['High', 'Medium', 'Low'],
        default: 'Medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, "Please assign this task to a team member"]
    },
    project: {
        type: String,
        required: [true, "Project name is required"]
    },
    dueDate: {
        type: Date,
        required: [true, "Due date is mandatory for tracking progress"]
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

module.exports = mongoose.model('Task', TaskSchema);