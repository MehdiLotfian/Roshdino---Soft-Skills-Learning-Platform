const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticateToken, updateLastLogin } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateRegistration = [
    body('username')
        .isLength({ min: 3, max: 30 })
        .withMessage('Username must be between 3 and 30 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    body('firstName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('First name is required'),
    body('lastName')
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Last name is required'),
    body('role')
        .isIn(['user', 'manager'])
        .withMessage('Role must be either user or manager')
];

const validateLogin = [
    body('username')
        .notEmpty()
        .withMessage('Username is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, email, password, firstName, lastName, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }]
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Create new user
        const user = new User({
            username,
            email,
            password,
            firstName,
            lastName,
            role: role || 'user'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                points: user.points,
                trainingProgress: user.trainingProgress
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;

        // Find user by username or email
        const user = await User.findOne({
            $or: [
                { username },
                { email: username }
            ]
        });

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials or inactive account'
            });
        }

        // Check password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Fetch the latest user data (with up-to-date points)
        const latestUser = await User.findById(user._id);

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: latestUser._id,
                username: latestUser.username,
                email: latestUser.email,
                firstName: latestUser.firstName,
                lastName: latestUser.lastName,
                role: latestUser.role,
                points: latestUser.points,
                trainingProgress: latestUser.trainingProgress,
                badges: latestUser.badges,
                certificates: latestUser.certificates
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get current user profile
router.get('/profile', authenticateToken, updateLastLogin, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password')
            .populate('quizHistory.quiz', 'title role difficulty');

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update user profile
router.put('/profile', authenticateToken, [
    body('firstName').optional().trim().isLength({ min: 1, max: 50 }),
    body('lastName').optional().trim().isLength({ min: 1, max: 50 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('preferences').optional().isObject()
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { firstName, lastName, email, preferences } = req.body;
        const updateData = {};

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (email) updateData.email = email;
        if (preferences) updateData.preferences = preferences;

        // Check if email is already taken
        if (email) {
            const existingUser = await User.findOne({ 
                email, 
                _id: { $ne: req.user._id } 
            });
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already exists'
                });
            }
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Change password
router.put('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        // Verify current password
        const user = await User.findById(req.user._id);
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        
        if (!isCurrentPasswordValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Update password
        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        const newToken = jwt.sign(
            { userId: req.user._id },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            token: newToken
        });

    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed'
        });
    }
});

module.exports = router; 