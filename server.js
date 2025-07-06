const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const quizRoutes = require('./routes/quizzes');
const leaderboardRoutes = require('./routes/leaderboard');
const certificateRoutes = require('./routes/certificates');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');

// Import middleware
const { authenticateToken } = require('./middleware/auth');

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roshdino', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Security middleware with CSP configuration
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/quizzes', authenticateToken, quizRoutes);
app.use('/api/leaderboard', authenticateToken, leaderboardRoutes);
app.use('/api/certificates', authenticateToken, certificateRoutes);
app.use('/api/reports', authenticateToken, reportRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API route not found'
    });
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join user to their personal room
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`User ${userId} joined their room`);
    });

    // Handle real-time notifications
    socket.on('notification', (data) => {
        io.to(`user_${data.userId}`).emit('newNotification', data);
    });

    // Handle quiz progress updates
    socket.on('quizProgress', (data) => {
        io.to(`user_${data.userId}`).emit('progressUpdate', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`🚀 Roshdino server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 API available at: http://localhost:${PORT}/api`);
});

module.exports = { app, server, io }; 