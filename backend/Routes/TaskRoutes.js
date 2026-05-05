const router = require('express').Router();
const { body } = require('express-validator');
const { verifyToken } = require('../Middleware/auth');
const {
    createTask, getTasks, getTasksByProject,
    updateTask, updateTaskStatus, deleteTask
} = require('../Controllers/TaskController');

router.post('/', verifyToken, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('project').notEmpty().withMessage('Project ID is required')
], createTask);

router.get('/', verifyToken, getTasks);
router.get('/project/:projectId', verifyToken, getTasksByProject);
router.put('/:id', verifyToken, updateTask);
router.patch('/:id/status', verifyToken, [
    body('status').isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status')
], updateTaskStatus);
router.delete('/:id', verifyToken, deleteTask);

module.exports = router;
