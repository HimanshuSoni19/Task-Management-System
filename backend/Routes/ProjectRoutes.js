const router = require('express').Router();
const { body } = require('express-validator');
const { verifyToken } = require('../Middleware/auth');
const {
    createProject, getProjects, getProjectById,
    updateProject, deleteProject, addMember, removeMember
} = require('../Controllers/ProjectController');

router.post('/', verifyToken, [
    body('title').trim().notEmpty().withMessage('Title is required')
], createProject);

router.get('/', verifyToken, getProjects);
router.get('/:id', verifyToken, getProjectById);
router.put('/:id', verifyToken, updateProject);
router.delete('/:id', verifyToken, deleteProject);

router.post('/:id/members', verifyToken, [
    body('email').isEmail().withMessage('Valid email is required')
], addMember);
router.delete('/:id/members/:userId', verifyToken, removeMember);

module.exports = router;
