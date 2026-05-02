const router = require('express').Router();
const Task = require('../models/Task');
const Activity = require('../models/Activity'); // Activity model import karein
const { auth, adminOnly } = require('../middleware/auth');

// --- ACTIVITY UTILITY FUNCTION ---
// Har action ke baad isko call karenge logs save karne ke liye
const logActivity = async (userName, action, taskTitle) => {
    try {
        const newActivity = new Activity({ userName, action, taskTitle });
        await newActivity.save();
    } catch (err) {
        console.error("Activity log fail:", err);
    }
};

// @route   GET /api/tasks/all (Jo dashboard use kar raha hai)
router.get('/all', auth, async (req, res) => {
    try {
        let tasks;
        if (req.user.role.toUpperCase() === 'ADMIN') {
            tasks = await Task.find().populate('assignedTo', 'name email').sort({ createdAt: -1 });
        } else {
            tasks = await Task.find({ assignedTo: req.user.id }).populate('assignedTo', 'name').sort({ createdAt: -1 });
        }
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: "Server Error" });
    }
});

// @route   POST /api/tasks/add
router.post('/add', auth, adminOnly, async (req, res) => {
    try {
        const { title, description, assignedTo, project, dueDate, priority } = req.body;

        const newTask = new Task({
            title, description, assignedTo, project, dueDate, priority,
            createdBy: req.user.id
        });

        await newTask.save();

        // Log the creation
        await logActivity(req.user.name, 'created mission', title);

        const populatedTask = await Task.findById(newTask._id).populate('assignedTo', 'name');
        res.status(201).json(populatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// @route   PUT /api/tasks/:id (Update Status/Details)
router.put('/:id', auth, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task nahi mila" });

        // Update logic
        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('assignedTo', 'name');

        // Log specific action (status change or update)
        const actionMessage = req.body.status ? `changed status to ${req.body.status}` : 'updated mission details';
        await logActivity(req.user.name, actionMessage, updatedTask.title);

        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: "Update fail ho gaya" });
    }
});

// @route   DELETE /api/tasks/:id
router.delete('/:id', auth, adminOnly, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: "Task nahi mila" });

        await Task.findByIdAndDelete(req.params.id);

        // Log the deletion
        await logActivity(req.user.name, 'deleted mission', task.title);

        res.json({ message: "Task delete ho gaya!" });
    } catch (err) {
        res.status(500).json({ message: "Delete fail ho gaya" });
    }
});

// --- NEW ROUTES FOR ACTIVITIES ---

// @route   GET /api/tasks/activities/all
router.get('/activities/all', auth, async (req, res) => {
    try {
        const activities = await Activity.find().sort({ createdAt: -1 }).limit(20);
        res.json(activities);
    } catch (err) {
        res.status(500).json({ message: "Logs fetch nahi ho paye" });
    }
});

// @route   DELETE /api/tasks/activities/clear (FOR ADMIN ONLY)
router.delete('/activities/clear', auth, adminOnly, async (req, res) => {
    try {
        await Activity.deleteMany({});
        res.json({ message: "Logs cleared successfully" });
    } catch (err) {
        res.status(500).json({ message: "Purge failed" });
    }
});

module.exports = router;