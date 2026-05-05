if (!utils.requireAuth()) throw new Error('Redirecting...');

const user = utils.getUser();
let chartInstance = null;

// Init navbar
function initNavbar() {
    document.getElementById('navName').textContent = user.name;
    document.getElementById('navRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const av = document.getElementById('navAvatar');
    av.textContent = utils.getInitials(user.name);
    av.style.background = utils.avatarColor(user.name);
    document.getElementById('greetMsg').textContent = `Welcome back, ${user.name.split(' ')[0]}! Here's your overview.`;
    if (utils.isAdmin()) {
        document.getElementById('adminActions').classList.remove('hidden');
    }
}

// Load dashboard stats
async function loadStats() {
    try {
        const data = await api.getStats();
        const { stats, recentTasks } = data;
        document.getElementById('statTotal').textContent = stats.totalTasks;
        document.getElementById('statProgress').textContent = stats.inProgressTasks;
        document.getElementById('statDone').textContent = stats.doneTasks;
        document.getElementById('statOverdue').textContent = stats.overdueTasks;
        renderChart(stats);
        renderRecentTasks(recentTasks);
    } catch (err) {
        utils.showToast('Failed to load stats: ' + err.message, 'error');
    }
}

// Chart
function renderChart(stats) {
    const ctx = document.getElementById('statusChart').getContext('2d');
    if (chartInstance) chartInstance.destroy();
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['To Do', 'In Progress', 'Done'],
            datasets: [{
                data: [stats.todoTasks, stats.inProgressTasks, stats.doneTasks],
                backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
                borderColor: '#111827',
                borderWidth: 3,
                hoverOffset: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94A3B8', padding: 16, font: { family: 'Inter', size: 12, weight: '600' }, boxWidth: 12, borderRadius: 4 }
                }
            }
        }
    });
}

// Recent Tasks Table
function renderRecentTasks(tasks) {
    const wrap = document.getElementById('recentTasksWrap');
    if (!tasks || tasks.length === 0) {
        wrap.innerHTML = `<div class="empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
            <h3>No tasks yet</h3><p>Create a project and start adding tasks.</p></div>`;
        return;
    }
    const rows = tasks.map(t => {
        const overdue = utils.isOverdue(t.dueDate) && t.status !== 'done';
        const dueBadge = overdue ? `<span class="badge badge-overdue">Overdue</span>` : utils.formatDate(t.dueDate);
        const assignee = t.assignee ? `${utils.renderAvatar(t.assignee.name, 'avatar-sm')} <span>${t.assignee.name}</span>` : '—';
        return `<tr onclick="window.location='project.html?id=${t.project._id}'" style="cursor:pointer">
            <td><span style="font-weight:600">${t.title}</span><br><span style="color:var(--text-muted);font-size:0.8rem">${t.project?.title || ''}</span></td>
            <td>${utils.statusBadge(t.status)}</td>
            <td>${utils.priorityBadge(t.priority)}</td>
            <td><div class="flex items-center gap-sm">${assignee}</div></td>
            <td>${dueBadge}</td>
        </tr>`;
    }).join('');
    wrap.innerHTML = `<table>
        <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Assignee</th><th>Due</th></tr></thead>
        <tbody>${rows}</tbody>
    </table>`;
}

// Load Projects
async function loadProjects() {
    try {
        const data = await api.getProjects();
        const projects = data.projects;
        document.getElementById('projectCount').textContent = projects.length;
        const list = document.getElementById('projectList');
        if (!projects.length) {
            list.innerHTML = `<div class="empty-state"><h3>No projects yet</h3><p>${utils.isAdmin() ? 'Click "New Project" to get started.' : 'You haven\'t been added to any project.'}</p></div>`;
            return;
        }
        list.innerHTML = projects.map(p => {
            const deadline = p.deadline ? utils.formatDate(p.deadline) : 'No deadline';
            const isOverdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
            return `<div class="project-item" onclick="window.location='project.html?id=${p._id}'">
                <div class="project-item-info">
                    <h4>${p.title}</h4>
                    <p>${p.members.length} member${p.members.length !== 1 ? 's' : ''} • ${deadline}</p>
                </div>
                <div class="project-item-meta">
                    <span class="badge badge-${p.status}">${p.status}</span>
                    ${isOverdue ? '<span class="badge badge-overdue">Overdue</span>' : ''}
                </div>
            </div>`;
        }).join('');
    } catch (err) {
        utils.showToast('Failed to load projects.', 'error');
    }
}

// Create Project
async function createProject() {
    const title = document.getElementById('projTitle').value.trim();
    const description = document.getElementById('projDesc').value.trim();
    const deadline = document.getElementById('projDeadline').value;
    const errEl = document.getElementById('createProjectError');
    errEl.classList.add('hidden');
    if (!title) { errEl.textContent = 'Title is required.'; errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('createProjBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
        await api.createProject({ title, description, deadline: deadline || undefined });
        utils.closeModal('createProjectModal');
        document.getElementById('projTitle').value = '';
        document.getElementById('projDesc').value = '';
        document.getElementById('projDeadline').value = '';
        utils.showToast('Project created successfully!', 'success');
        loadProjects();
        loadStats();
    } catch (err) {
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Create Project';
    }
}

// Close modal on backdrop click
document.getElementById('createProjectModal').addEventListener('click', function(e) {
    if (e.target === this) utils.closeModal('createProjectModal');
});

function logout() {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    window.location.href = 'index.html';
}

// Init
initNavbar();
loadStats();
loadProjects();
