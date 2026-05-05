# TaskFlow — Full-Stack Task Management System

A production-ready project management application built with a focus on clean architecture, role-based security, and a responsive glassmorphism UI.

**Live Demo**: [task-management-system-production-cea8.up.railway.app](https://task-management-system-production-cea8.up.railway.app)

## 🛠 Tech Stack
- **Backend**: Node.js, Express.js (REST API)
- **Database**: MongoDB Atlas (NoSQL) with Mongoose ODM
- **Auth**: JWT (JSON Web Tokens) + bcryptjs (Hashing)
- **Frontend**: Vanilla HTML5, CSS3 (Custom Design System), JavaScript (ES6+)
- **Charts**: Chart.js for dashboard analytics
- **Validation**: Express-validator for API payload sanitization

## 🏗 Project Architecture
The system follows a standard MVC-lite pattern for the backend to ensure scalability and ease of maintenance:

```text
/backend
  ├── Controllers/   # Business logic (Auth, Projects, Tasks)
  ├── Models/        # Mongoose schemas (User, Project, Task)
  ├── Routes/        # API endpoint definitions
  ├── Middleware/    # JWT verification & RBAC guards
  └── index.js       # Entry point & static file serving
/frontend
  ├── css/           # Modular design system (glassmorphism)
  ├── js/            # API client and DOM logic
  └── *.html         # Multi-page application (SPA-like navigation)
```

## 🔒 Key Security Features
- **JWT-Auth**: Stateless authentication using signed tokens.
- **RBAC**: Role-Based Access Control. `Admin` users have project creation rights; `Members` are limited to assigned tasks.
- **Middleware Guards**: Custom middleware `verifyToken` and `isProjectAdmin` protect sensitive endpoints at the server level.
- **Password Safety**: passwords are never stored in plain text; salted and hashed using 12 rounds of bcrypt.

## 🚀 Local Setup
1. **Clone the repo**
2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   ```
3. **Configure Environment**:
   Create a `.env` file in the `/backend` directory:
   ```env
   PORT=8080
   DB_URL=your_mongodb_atlas_uri
   JWT_SECRET=your_super_secret_key
   ```
4. **Run Server**:
   ```bash
   npm start
   ```
5. **Access App**: Open `http://localhost:8080` in your browser.

## 📈 Future Roadmap
- [ ] Real-time notifications via WebSockets (Socket.io).
- [ ] File attachments for task descriptions.
- [ ] Team chat integration per project.
- [ ] Multi-tenant support for different organizations.

---
**Author**: Himanshu Soni
**License**: MIT
