require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const fs = require('fs');

const pool = require('./config/db');
const { requireAuth } = require('./middleware/auth');
const dashboard = require('./controllers/dashboardController');

const app = express();

// Create uploads folder if it doesn't exist (may fail on Vercel's read-only filesystem)
try {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
} catch (err) {
    console.log('Could not create uploads folder:', err.message);
}

// Needed behind Vercel's proxy so secure cookies work
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session (stored in MySQL so logins survive on Vercel)
const sessionStore = new MySQLStore({ createDatabaseTable: true }, pool);

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'prepnest-dev-secret',
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 7,
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production'
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

// Server (Vercel handles this itself, so only listen when running locally)
const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`PrepNest running on port ${PORT}`);
    });
}

module.exports = app;