require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const { requireAuth } = require('./middleware/auth');
const dashboard = require('./controllers/dashboardController');

const app = express();

// Create uploads folder if it doesn't exist
fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session
app.use(
    session({
        secret: process.env.SESSION_SECRET || 'prepnest-dev-secret',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7
        }
    })
);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Serve frontend
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes
app.use(require('./routes/authRoutes'));
app.use(require('./routes/pdfRoutes'));
app.use(require('./routes/resourceRoutes'));

// Dashboard
app.get('/dashboard', requireAuth, dashboard.summary);

// For frontend pages
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrepNest running on port ${PORT}`);
});