const Task = require('../Models/Task');
const Project = require('../Models/Project');

// GET /api/dashboard/stats
const getStats = async (req, res) => {
    try {
        const projects = await Project.find({ 'members.user': req.user._id }).select('_id');
        const projectIds = projects.map(p => p._id);

        const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });
        const todoTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'todo' });
        const inProgressTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' });
        const doneTasks = await Task.countDocuments({ project: { $in: projectIds }, status: 'done' });
        const overdueTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: { $ne: 'done' },
            dueDate: { $lt: new Date() }
        });
        const highPriority = await Task.countDocuments({ project: { $in: projectIds }, priority: 'high', status: { $ne: 'done' } });

        const recentTasks = await Task.find({ project: { $in: projectIds } })
            .populate('assignee', 'name email')
            .populate('project', 'title')
            .sort({ createdAt: -1 })
            .limit(10);

        res.json({
            success: true,
            stats: {
                totalTasks, todoTasks, inProgressTasks, doneTasks, overdueTasks, highPriority,
                totalProjects: projects.length
            },
            recentTasks
        });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error.', error: err.message });
    }
};

module.exports = { getStats };
