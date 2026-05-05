const router = require('express').Router();
const { verifyToken } = require('../Middleware/auth');
const { getStats } = require('../Controllers/DashboardController');

router.get('/stats', verifyToken, getStats);

module.exports = router;
