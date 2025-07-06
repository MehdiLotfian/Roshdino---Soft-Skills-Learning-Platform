const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.userId).select('-password');
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or inactive user'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        } else if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

// Middleware to check if user has required role
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles) ? roles : [roles];

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

// Middleware to check if user is manager or admin
const requireManager = requireRole(['manager', 'admin']);

// Middleware to check if user is admin only
const requireAdmin = requireRole('admin');

// Middleware to check if user is the owner of the resource
const requireOwnership = (resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];
        
        if (!resourceUserId) {
            return res.status(400).json({
                success: false,
                message: 'Resource user ID required'
            });
        }

        // Allow if user is admin or manager, or if they own the resource
        if (req.user.role === 'admin' || req.user.role === 'manager' || 
            resourceUserId === req.user._id.toString()) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: 'Access denied'
        });
    };
};

// Middleware to generate new token
const refreshToken = async (req, res, next) => {
    try {
        const user = req.user;
        
        const newToken = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            token: newToken,
            user: user
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
};

// Middleware to update last login
const updateLastLogin = async (req, res, next) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, {
                lastLogin: new Date()
            });
        }
        next();
    } catch (error) {
        console.error('Update last login error:', error);
        next(); // Don't fail the request for this
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireManager,
    requireAdmin,
    requireOwnership,
    refreshToken,
    updateLastLogin
}; 