const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // 1. Front-end se 'Authorization' header nikalna
    const authHeader = req.header('Authorization');

    // 2. Check karna ki header hai ya nahi
    if (!authHeader) {
        return res.status(401).json({ msg: "No token, authorization denied" });
    }

    // 3. 'Bearer <token>' mein se sirf token nikalna
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ msg: "Token format is invalid" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ msg: "Token is not valid" });
    }
};

const adminOnly = (req, res, next) => {
    // Check karo ki Admin ki spelling wahi hai jo database mein hai
    if (req.user.role !== 'Admin' && req.user.role !== 'ADMIN') {
        return res.status(403).json({ msg: "Access denied. Admins only." });
    }
    next();
};

module.exports = { auth, adminOnly };