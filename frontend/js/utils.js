// Utility helpers
const utils = {
    getUser() {
        const u = localStorage.getItem('tms_user');
        return u ? JSON.parse(u) : null;
    },
    setUser(user) {
        localStorage.setItem('tms_user', JSON.stringify(user));
    },
    isAdmin() {
        const u = this.getUser();
        return u && u.role === 'admin';
    },
    requireAuth() {
        if (!localStorage.getItem('tms_token')) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },
    formatDate(d) {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },
    isOverdue(dueDate) {
        if (!dueDate) return false;
        return new Date(dueDate) < new Date() ;
    },
    getInitials(name) {
        if (!name) return '?';
        return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    },
    avatarColor(name) {
        const colors = ['#6366F1','#8B5CF6','#EC4899','#3B82F6','#10B981','#F59E0B','#EF4444','#14B8A6'];
        let hash = 0;
        for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    },
    showToast(message, type = 'success') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400);
        }, 3000);
    },
    openModal(id) {
        document.getElementById(id).classList.add('active');
    },
    closeModal(id) {
        document.getElementById(id).classList.remove('active');
    },
    renderAvatar(name, extraClass = '') {
        const initials = this.getInitials(name);
        const color = this.avatarColor(name);
        return `<div class="avatar ${extraClass}" style="background:${color}">${initials}</div>`;
    },
    statusBadge(status) {
        const labels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };
        return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
    },
    priorityBadge(p) {
        return `<span class="badge badge-${p}">${p}</span>`;
    }
};
