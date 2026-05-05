// API Client
const API_BASE = '/api';

const api = {
    getToken() {
        return localStorage.getItem('tms_token');
    },
    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
        return headers;
    },
    async request(method, endpoint, body = null) {
        const options = { method, headers: this.getHeaders() };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await res.json();
        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('tms_token');
                localStorage.removeItem('tms_user');
                window.location.href = 'index.html';
            }
            throw new Error(data.message || 'Something went wrong');
        }
        return data;
    },
    // Auth
    signup(body) { return this.request('POST', '/auth/signup', body); },
    login(body) { return this.request('POST', '/auth/login', body); },
    getMe() { return this.request('GET', '/auth/me'); },
    // Projects
    createProject(body) { return this.request('POST', '/projects', body); },
    getProjects() { return this.request('GET', '/projects'); },
    getProject(id) { return this.request('GET', `/projects/${id}`); },
    updateProject(id, body) { return this.request('PUT', `/projects/${id}`, body); },
    deleteProject(id) { return this.request('DELETE', `/projects/${id}`); },
    addMember(projectId, body) { return this.request('POST', `/projects/${projectId}/members`, body); },
    removeMember(projectId, userId) { return this.request('DELETE', `/projects/${projectId}/members/${userId}`); },
    // Tasks
    createTask(body) { return this.request('POST', '/tasks', body); },
    getTasks() { return this.request('GET', '/tasks'); },
    getTasksByProject(projectId) { return this.request('GET', `/tasks/project/${projectId}`); },
    updateTask(id, body) { return this.request('PUT', `/tasks/${id}`, body); },
    updateTaskStatus(id, status) { return this.request('PATCH', `/tasks/${id}/status`, { status }); },
    deleteTask(id) { return this.request('DELETE', `/tasks/${id}`); },
    // Dashboard
    getStats() { return this.request('GET', '/dashboard/stats'); },
};
