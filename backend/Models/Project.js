const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    }
}, { _id: false });

const projectSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Project title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters']
    },
    description: {
        type: String,
        trim: true,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    members: [memberSchema],
    status: {
        type: String,
        enum: ['active', 'on-hold', 'completed'],
        default: 'active'
    },
    deadline: {
        type: Date
    }
}, { timestamps: true });

// Ensure owner is always in members list
projectSchema.pre('save', async function () {
    if (!this.owner) return;
    const ownerInMembers = this.members.some(
        m => m.user.toString() === this.owner.toString()
    );
    if (!ownerInMembers) {
        this.members.push({ user: this.owner, role: 'admin' });
    }
});

module.exports = mongoose.model('Project', projectSchema);
