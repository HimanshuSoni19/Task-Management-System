const Project = require('../Models/Project');
const User = require('../Models/User');
const Task = require('../Models/Task');
const { validationResult } = require('express-validator');
const { isProjectMember, isProjectAdmin } = require('../Middleware/auth');

// POST /api/projects
const createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

        const { title, description, deadline } = req.body;
        const project = await Project.create({
            title,
            description,
            owner: req.user._id,
            deadline: deadline || null,
            members: [{ user: req.user._id, role: 'admin' }]
        });
        await project.populate('owner', 'name email');
        res.status(201).json({ success: true, message: 'Project created.', project });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// GET /api/projects
const getProjects = async (req, res) => {
    try {
        const projects = await Project.find({ 'members.user': req.user._id })
            .populate('owner', 'name email')
            .populate('members.user', 'name email')
            .sort({ createdAt: -1 });
        res.json({ success: true, projects });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// GET /api/projects/:id
const getProjectById = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email')
            .populate('members.user', 'name email');
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (!isProjectMember(project, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Access denied.' });
        }
        res.json({ success: true, project });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// PUT /api/projects/:id
const updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (!isProjectAdmin(project, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only project admins can update.' });
        }
        const { title, description, status, deadline } = req.body;
        if (title) project.title = title;
        if (description !== undefined) project.description = description;
        if (status) project.status = status;
        if (deadline !== undefined) project.deadline = deadline;
        await project.save();
        await project.populate('owner', 'name email');
        await project.populate('members.user', 'name email');
        res.json({ success: true, message: 'Project updated.', project });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// DELETE /api/projects/:id
const deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (project.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the project owner can delete.' });
        }
        await Task.deleteMany({ project: project._id });
        await project.deleteOne();
        res.json({ success: true, message: 'Project and its tasks deleted.' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// POST /api/projects/:id/members
const addMember = async (req, res) => {
    try {
        const { email, role } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (!isProjectAdmin(project, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only project admins can add members.' });
        }
        const userToAdd = await User.findOne({ email });
        if (!userToAdd) return res.status(404).json({ success: false, message: 'User with that email not found.' });

        const alreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());
        if (alreadyMember) return res.status(409).json({ success: false, message: 'User is already a member.' });

        project.members.push({ user: userToAdd._id, role: role === 'admin' ? 'admin' : 'member' });
        await project.save();
        await project.populate('members.user', 'name email');
        res.json({ success: true, message: 'Member added.', members: project.members });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

// DELETE /api/projects/:id/members/:userId
const removeMember = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
        if (!isProjectAdmin(project, req.user._id)) {
            return res.status(403).json({ success: false, message: 'Only project admins can remove members.' });
        }
        if (project.owner.toString() === req.params.userId) {
            return res.status(400).json({ success: false, message: 'Cannot remove the project owner.' });
        }
        project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
        await project.save();
        res.json({ success: true, message: 'Member removed.', members: project.members });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, addMember, removeMember };
