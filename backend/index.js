const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
require('./Models/db');

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./Routes/AuthRoutes'));
app.use('/api/projects', require('./Routes/ProjectRoutes'));
app.use('/api/tasks', require('./Routes/TaskRoutes'));
app.use('/api/dashboard', require('./Routes/DashboardRoutes'));

// Fallback: serve index.html for any non-API route
app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error.' });
});

app.listen(PORT, () => {
    console.log(`Server is running on PORT = ${PORT}`);
});