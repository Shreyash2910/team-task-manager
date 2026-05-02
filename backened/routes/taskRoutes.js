const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Activity = require('../models/Activity'); // New model import
const { auth } = require('../middleware/auth'); // Auth middleware zaroori hai

// 1. Naya Task Add Karein + Activity Log
router.post('/add', auth, async (req, res) => {
    try {
        const { title, description, assignedTo, project, dueDate, priority } = req.body;

        const newTask = new Task({
            title,
            description,
            assignedTo,
            project,
            dueDate,
            priority: priority || 'Medium', // Default priority agar user ne nahi chuni
            createdBy: req.user.id // Token se admin ki ID
        });

        await newTask.save();

        // 📝 Activity Log mein record dalo
        await Activity.create({
            userName: req.user.name || "Admin",
            action: "created a new task",
            taskTitle: title
        });

        res.status(201).json({ message: "Task created!", task: newTask });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Saare Tasks Get Karein
router.get('/all', auth, async (req, res) => {
    try {
        const tasks = await Task.find().populate('assignedTo', 'name');
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Delete a task + Activity Log
router.delete('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ msg: "Task not found" });

        await Task.findByIdAndDelete(req.params.id);

        // 📝 Activity Log
        await Activity.create({
            userName: req.user.name || "Admin",
            action: "deleted a task",
            taskTitle: task.title
        });

        res.json({ message: "Task deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Update task status + Activity Log
router.put('/:id', auth, async (req, res) => {
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );

        // 📝 Activity Log
        await Activity.create({
            userName: req.user.name || "User",
            action: `changed status to ${req.body.status}`,
            taskTitle: updatedTask.title
        });

        res.json(updatedTask);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Activity Log Fetch karne ka route
router.get('/activities/all', auth, async (req, res) => {
    try {
        const activities = await Activity.find().sort({ createdAt: -1 }).limit(10);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;