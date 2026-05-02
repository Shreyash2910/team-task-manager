const router = require('express').Router();
const User = require('../models/User'); // Check karein aapka model path sahi hai
const { auth, adminOnly } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all registered users (Only for Admin to assign tasks)
router.get('/', auth, adminOnly, async (req, res) => {
    try {
        // Hum sirf name aur _id bhejenge, password nahi!
        const users = await User.find().select('name _id email');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Users list fetch karne mein dikkat aa rahi hai" });
    }
});

module.exports = router;