const Task = require('../Models/Task');
const Project = require('../Models/Project');
const { validationResult } = require('express-validator');
const { isProjectMember, isProjectAdmin } = require('../Middleware/auth');

// POST /api/tasks
const createTask = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { title, description, project, assignee, priority, dueDate } = req.body;

        const proj = await Project.findById(project);
        if (!proj) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (!isProjectAdmin(proj, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only project admins can create tasks.' });
        }
        if (assignee && !isProjectMember(proj, assignee)) {
            return res.status(400).json({ success: false, message: 'Assignee must be a project member.' });
        }

        const task = await Task.create({
            title, description, project,
            assignee: assignee || null,
            createdBy: req.user._id,
            priority: (priority || 'medium').toLowerCase(),
            dueDate: dueDate || null
        });
        await task.populate('assignee', 'name email');
        await task.populate('createdBy', 'name email');
        res.status(201).json({ success: true, message: 'Task created.', task });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// GET /api/tasks — all tasks for user's projects
const getTasks = async (req, res) => {
    try {
        const projects = await Project.find({ 'members.user': req.user._id }).select('_id');
        const projectIds = projects.map(p => p._id);
        const tasks = await Task.find({ project: { $in: projectIds } })
            .populate('assignee', 'name email')
            .populate('createdBy', 'name email')
            .populate('project', 'title')
            .sort({ createdAt: -1 });
        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// GET /api/tasks/project/:projectId
const getTasksByProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.projectId);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (!isProjectMember(project, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        const tasks = await Task.find({ project: req.params.projectId })
            .populate('assignee', 'name email')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// PUT /api/tasks/:id
const updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

        const project = await Project.findById(task.project);
        const isAdmin = isProjectAdmin(project, req.user._id);
        const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();

        if (!isAdmin && !isAssignee) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        const { title, description, assignee, status, priority, dueDate } = req.body;
        if (isAdmin) {
            if (title) task.title = title;
            if (description !== undefined) task.description = description;
            if (assignee !== undefined) task.assignee = assignee || null;
            if (priority) task.priority = priority.toLowerCase();
            if (dueDate !== undefined) task.dueDate = dueDate;
        }
        if (status) task.status = status.toLowerCase();
        await task.save();
        await task.populate('assignee', 'name email');
        await task.populate('createdBy', 'name email');
        await task.populate('project', 'title');
        res.json({ success: true, message: 'Task updated.', task });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// PATCH /api/tasks/:id/status
const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['todo', 'in-progress', 'done'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status.' });
        }
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

        const project = await Project.findById(task.project);
        const isAdmin = isProjectAdmin(project, req.user._id);
        const isAssignee = task.assignee && task.assignee.toString() === req.user._id.toString();
        if (!isAdmin && !isAssignee) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }

        task.status = status.toLowerCase();
        await task.save();
        await task.populate('assignee', 'name email');
        await task.populate('project', 'title');
        res.json({ success: true, message: 'Status updated.', task });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ success: false, message: 'Task not found.' });

        const project = await Project.findById(task.project);
        if (!isProjectAdmin(project, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only project admins can delete tasks.' });
        }

        await task.deleteOne();
        res.json({ success: true, message: 'Task deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

module.exports = { createTask, getTasks, getTasksByProject, updateTask, updateTaskStatus, deleteTask };
