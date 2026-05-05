const router = require('express').Router();
const { body } = require('express-validator');
const { signup, login, getMe } = require('../Controllers/AuthController');
const { verifyToken } = require('../Middleware/auth');

router.post('/signup', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], signup);

router.post('/login', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], login);

router.get('/me', verifyToken, getMe);

module.exports = router;
