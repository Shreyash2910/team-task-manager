const router = require('express').Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   GET /api/auth/users
// @desc    Get all users for the Admin dropdown
router.get('/users', async (req, res) => {
    try {
        // Hum sirf name aur _id bhej rahe hain security ke liye
        const users = await User.find().select('name _id');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Users fetch karne mein error aaya" });
    }
});

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Email already exists" });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || 'Member'
        });
        await user.save();
        res.status(201).json({ message: "User Created Successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
            return res.status(400).json({ message: "Invalid Credentials" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            role: user.role,
            userName: user.name,
            userId: user._id
        });
    } catch (err) {
        res.status(500).json({ message: "Login failed" });
    }
});

module.exports = router;