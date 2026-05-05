if (!utils.requireAuth()) throw new Error('Redirecting...');

const user = utils.getUser();
const projectId = new URLSearchParams(window.location.search).get('id');
let currentProject = null;
let currentTasks = [];

if (!projectId) window.location.href = 'dashboard.html';

// Navbar
function initNavbar() {
    document.getElementById('navName').textContent = user.name;
    document.getElementById('navRole').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    const av = document.getElementById('navAvatar');
    av.textContent = utils.getInitials(user.name);
    av.style.background = utils.avatarColor(user.name);
}

// Load Project
async function loadProject() {
    try {
        const data = await api.getProject(projectId);
        currentProject = data.project;
        renderProjectHeader(currentProject);
        renderMembers(currentProject.members);
        populateAssigneeDropdowns(currentProject.members);
        const isAdmin = isProjectAdmin();
        if (isAdmin) {
            document.getElementById('createTaskBtnWrap').classList.remove('hidden');
            document.getElementById('addMemberBtnWrap').classList.remove('hidden');
        }
    } catch (err) {
        utils.showToast('Failed to load project: ' + err.message, 'error');
    }
}

function isProjectAdmin() {
    if (!currentProject) return false;
    const m = currentProject.members.find(m => m.user._id === user.id);
    return m && m.role === 'admin';
}

// Render Project Header
function renderProjectHeader(p) {
    const isAdmin = currentProject.members.find(m => m.user._id === user.id)?.role === 'admin';
    const deadline = p.deadline ? utils.formatDate(p.deadline) : 'No deadline';
    const overdue = p.deadline && new Date(p.deadline) < new Date() && p.status !== 'completed';
    document.getElementById('projectHeader').innerHTML = `
        <div style="flex:1">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px;flex-wrap:wrap">
                <h1 class="project-title">${p.title}</h1>
                <span class="badge badge-${p.status}">${p.status}</span>
                ${overdue ? '<span class="badge badge-overdue">Overdue</span>' : ''}
            </div>
            <p class="project-desc">${p.description || 'No description provided.'}</p>
            <div class="project-meta">
                <div class="project-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    Deadline: ${deadline}
                </div>
                <div class="project-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
                    ${p.members.length} member${p.members.length !== 1 ? 's' : ''}
                </div>
                <div class="project-meta-item">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    Created ${utils.formatDate(p.createdAt)}
                </div>
            </div>
        </div>
        ${isAdmin ? `<div class="project-actions">
            <button class="btn btn-secondary btn-sm" onclick="openEditProject()">Edit Project</button>
            <button class="btn btn-danger btn-sm" onclick="deleteProject()">Delete</button>
        </div>` : ''}
    `;
}

// Load Tasks
async function loadTasks() {
    try {
        const data = await api.getTasksByProject(projectId);
        currentTasks = data.tasks;
        renderKanban(currentTasks);
    } catch (err) {
        utils.showToast('Failed to load tasks.', 'error');
    }
}

// Render Kanban
function renderKanban(tasks) {
    const cols = { 'todo': [], 'in-progress': [], 'done': [] };
    tasks.forEach(t => { if (cols[t.status]) cols[t.status].push(t); });

    document.getElementById('countTodo').textContent = cols['todo'].length;
    document.getElementById('countProgress').textContent = cols['in-progress'].length;
    document.getElementById('countDone').textContent = cols['done'].length;

    document.getElementById('colTodo').innerHTML = renderTaskCards(cols['todo']);
    document.getElementById('colProgress').innerHTML = renderTaskCards(cols['in-progress']);
    document.getElementById('colDone').innerHTML = renderTaskCards(cols['done']);
}

function renderTaskCards(tasks) {
    if (!tasks.length) {
        return `<div style="text-align:center;padding:24px;color:var(--text-muted);font-size:0.85rem">No tasks here</div>`;
    }
    return tasks.map(t => {
        const overdue = utils.isOverdue(t.dueDate) && t.status !== 'done';
        const assigneeHtml = t.assignee
            ? `${utils.renderAvatar(t.assignee.name, 'avatar-sm')} <span>${t.assignee.name}</span>`
            : `<span style="color:var(--text-muted)">Unassigned</span>`;
        const quickStatusOpts = ['todo','in-progress','done'].filter(s => s !== t.status)
            .map(s => {
                const labels = {'todo':'To Do','in-progress':'In Progress','done':'Done'};
                return `<button class="btn-icon" title="Move to ${labels[s]}" onclick="event.stopPropagation();quickStatus('${t._id}','${s}')">
                    ${s === 'done' ? '✓' : s === 'in-progress' ? '▶' : '↩'}
                </button>`;
            }).join('');
        return `<div class="task-card" onclick="openEditTask('${t._id}')">
            <div class="task-card-top">
                ${utils.priorityBadge(t.priority)}
                <div class="task-card-actions">${quickStatusOpts}</div>
            </div>
            <h4>${t.title}</h4>
            ${t.description ? `<p class="task-card-desc">${t.description}</p>` : ''}
            <div class="task-card-bottom">
                <div class="task-card-assignee">${assigneeHtml}</div>
                <span class="task-card-due ${overdue ? 'badge badge-overdue' : ''}">${overdue ? 'Overdue' : utils.formatDate(t.dueDate)}</span>
            </div>
        </div>`;
    }).join('');
}

// Quick status update
async function quickStatus(taskId, status) {
    try {
        await api.updateTaskStatus(taskId, status);
        utils.showToast('Status updated!', 'success');
        loadTasks();
    } catch (err) {
        utils.showToast(err.message, 'error');
    }
}

// Populate Assignee dropdowns
function populateAssigneeDropdowns(members) {
    const opts = `<option value="">Unassigned</option>` + members.map(m =>
        `<option value="${m.user._id}">${m.user.name}</option>`
    ).join('');
    document.getElementById('taskAssignee').innerHTML = opts;
    document.getElementById('editTaskAssignee').innerHTML = opts;
}

// Create Task
async function createTask() {
    const title = document.getElementById('taskTitle').value.trim();
    const description = document.getElementById('taskDesc').value.trim();
    const priority = document.getElementById('taskPriority').value;
    const dueDate = document.getElementById('taskDueDate').value;
    const assignee = document.getElementById('taskAssignee').value;
    const errEl = document.getElementById('createTaskError');
    errEl.classList.add('hidden');
    if (!title) { errEl.textContent = 'Title is required.'; errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('createTaskBtn');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
        await api.createTask({ title, description, project: projectId, priority, dueDate: dueDate || undefined, assignee: assignee || undefined });
        utils.closeModal('createTaskModal');
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDesc').value = '';
        document.getElementById('taskDueDate').value = '';
        utils.showToast('Task created!', 'success');
        loadTasks();
    } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Create Task';
    }
}

// Open Edit Task Modal
function openEditTask(taskId) {
    const task = currentTasks.find(t => t._id === taskId);
    if (!task) return;
    document.getElementById('editTaskId').value = taskId;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDesc').value = task.description || '';
    document.getElementById('editTaskStatus').value = task.status;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskDueDate').value = task.dueDate ? task.dueDate.split('T')[0] : '';
    document.getElementById('editTaskAssignee').value = task.assignee?._id || '';
    // Hide admin fields for non-admin members
    const adminOnly = isProjectAdmin();
    document.getElementById('editAssigneeWrap').style.display = adminOnly ? '' : 'none';
    document.getElementById('deleteTaskBtn').style.display = adminOnly ? '' : 'none';
    const editTitle = document.getElementById('editTaskTitle');
    editTitle.readOnly = !adminOnly;
    document.getElementById('editTaskDesc').readOnly = !adminOnly;
    utils.openModal('editTaskModal');
}

// Save Task
async function saveTask() {
    const id = document.getElementById('editTaskId').value;
    const title = document.getElementById('editTaskTitle').value.trim();
    const description = document.getElementById('editTaskDesc').value.trim();
    const status = document.getElementById('editTaskStatus').value;
    const priority = document.getElementById('editTaskPriority').value;
    const dueDate = document.getElementById('editTaskDueDate').value;
    const assignee = document.getElementById('editTaskAssignee').value;
    const errEl = document.getElementById('editTaskError');
    errEl.classList.add('hidden');
    const btn = document.getElementById('saveTaskBtn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
        await api.updateTask(id, { title, description, status, priority, dueDate: dueDate || undefined, assignee: assignee || undefined });
        utils.closeModal('editTaskModal');
        utils.showToast('Task updated!', 'success');
        loadTasks();
    } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Save Changes';
    }
}

// Delete Task
async function deleteTask() {
    const id = document.getElementById('editTaskId').value;
    if (!confirm('Delete this task? This cannot be undone.')) return;
    try {
        await api.deleteTask(id);
        utils.closeModal('editTaskModal');
        utils.showToast('Task deleted.', 'info');
        loadTasks();
    } catch (err) {
        utils.showToast(err.message, 'error');
    }
}

// Render Members
function renderMembers(members) {
    const list = document.getElementById('membersList');
    const isAdmin = isProjectAdmin();
    if (!members.length) { list.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem">No members.</p>'; return; }
    list.innerHTML = members.map(m => `
        <div class="member-item">
            <div class="member-info">
                ${utils.renderAvatar(m.user.name)}
                <div>
                    <div class="member-name">${m.user.name}</div>
                    <div class="member-email">${m.user.email}</div>
                </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px">
                <span class="badge badge-${m.role}">${m.role}</span>
                ${isAdmin && m.user._id !== user.id ? `<button class="btn-icon" title="Remove" onclick="removeMember('${m.user._id}')">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>` : ''}
            </div>
        </div>
    `).join('');
}

// Add Member
async function addMember() {
    const email = document.getElementById('memberEmail').value.trim();
    const role = document.getElementById('memberRole').value;
    const errEl = document.getElementById('addMemberError');
    errEl.classList.add('hidden');
    if (!email) { errEl.textContent = 'Email is required.'; errEl.classList.remove('hidden'); return; }
    const btn = document.getElementById('addMemberBtn');
    btn.disabled = true; btn.textContent = 'Adding…';
    try {
        const data = await api.addMember(projectId, { email, role });
        currentProject.members = data.members;
        renderMembers(data.members);
        populateAssigneeDropdowns(data.members);
        utils.closeModal('addMemberModal');
        document.getElementById('memberEmail').value = '';
        utils.showToast('Member added!', 'success');
    } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Add Member';
    }
}

// Remove Member
async function removeMember(userId) {
    if (!confirm('Remove this member from the project?')) return;
    try {
        const data = await api.removeMember(projectId, userId);
        currentProject.members = data.members;
        renderMembers(data.members);
        populateAssigneeDropdowns(data.members);
        utils.showToast('Member removed.', 'info');
    } catch (err) {
        utils.showToast(err.message, 'error');
    }
}

// Edit Project
function openEditProject() {
    document.getElementById('editProjTitle').value = currentProject.title;
    document.getElementById('editProjDesc').value = currentProject.description || '';
    document.getElementById('editProjStatus').value = currentProject.status;
    document.getElementById('editProjDeadline').value = currentProject.deadline ? currentProject.deadline.split('T')[0] : '';
    utils.openModal('editProjectModal');
}

async function saveProject() {
    const title = document.getElementById('editProjTitle').value.trim();
    const description = document.getElementById('editProjDesc').value.trim();
    const status = document.getElementById('editProjStatus').value;
    const deadline = document.getElementById('editProjDeadline').value;
    const errEl = document.getElementById('editProjectError');
    errEl.classList.add('hidden');
    const btn = document.getElementById('saveProjectBtn');
    btn.disabled = true; btn.textContent = 'Saving…';
    try {
        const data = await api.updateProject(projectId, { title, description, status, deadline: deadline || undefined });
        currentProject = data.project;
        renderProjectHeader(currentProject);
        utils.closeModal('editProjectModal');
        utils.showToast('Project updated!', 'success');
    } catch (err) {
        errEl.textContent = err.message; errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false; btn.textContent = 'Save Changes';
    }
}

async function deleteProject() {
    if (!confirm('Delete this entire project and all its tasks? This cannot be undone.')) return;
    try {
        await api.deleteProject(projectId);
        utils.showToast('Project deleted.', 'info');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 1200);
    } catch (err) {
        utils.showToast(err.message, 'error');
    }
}

// Close modals on backdrop
['createTaskModal','editTaskModal','addMemberModal','editProjectModal'].forEach(id => {
    document.getElementById(id).addEventListener('click', function(e) {
        if (e.target === this) utils.closeModal(id);
    });
});

function logout() {
    localStorage.removeItem('tms_token');
    localStorage.removeItem('tms_user');
    window.location.href = 'index.html';
}

// Init
initNavbar();
loadProject().then(() => loadTasks());
