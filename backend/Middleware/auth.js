const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
        }
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found.' });
        }
        req.user = user;
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }
};

// Only allow admins
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Access denied. Admins only.' });
    }
    next();
};

// Must be project member (or admin)
const isProjectMember = (project, userId) => {
    return project.members.some(m => {
        const mUserId = m.user._id ? m.user._id.toString() : m.user.toString();
        return mUserId === userId.toString();
    });
};

// Must be project admin (owner or member with admin role)
const isProjectAdmin = (project, userId) => {
    const ownerId = project.owner._id ? project.owner._id.toString() : project.owner.toString();
    return project.members.some(m => {
        const mUserId = m.user._id ? m.user._id.toString() : m.user.toString();
        return mUserId === userId.toString() && m.role === 'admin';
    }) || ownerId === userId.toString();
};

module.exports = { verifyToken, adminOnly, isProjectMember, isProjectAdmin };
