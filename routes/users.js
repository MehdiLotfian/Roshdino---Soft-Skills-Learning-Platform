const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const QuizResult = require('../models/QuizResult');
const { requireManager, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Get all users (Manager only)
router.get('/', requireManager, async (req, res) => {
    try {
        const { limit = 50, page = 1, role, search } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let query = { isActive: true };
        if (role) query.role = role;
        if (search) {
            query.$or = [
                { username: { $regex: search, $options: 'i' } },
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const users = await User.find(query)
            .select('-password')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get users',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('-password');

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

// Get user badges
router.get('/badges', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('badges');

        res.json({
            success: true,
            badges: user.badges || []
        });

    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get badges',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user certificates
router.get('/certificates', async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('certificates');

        res.json({
            success: true,
            certificates: user.certificates || []
        });

    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get certificates',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user by ID
router.get('/:userId', requireManager, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update user profile
router.put('/profile', [
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

// Update training progress
router.put('/training-progress', [
    body('progress').isNumeric().withMessage('Progress must be a number')
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

        const { progress } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.updateTrainingProgress(progress);

        res.json({
            success: true,
            message: 'Training progress updated successfully',
            trainingProgress: user.trainingProgress
        });

    } catch (error) {
        console.error('Update training progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update training progress',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user's quiz history
router.get('/quiz-history', async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 20, gameMode, role } = req.query;

        const query = { user: userId };
        if (gameMode) query.gameMode = gameMode;
        if (role) query.role = role;

        const history = await QuizResult.find(query)
            .populate('quiz', 'title role difficulty category')
            .sort({ completedAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            history
        });

    } catch (error) {
        console.error('Get quiz history error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get quiz history',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user statistics
router.get('/stats', async (req, res) => {
    try {
        const userId = req.user._id;

        // Get user's basic stats
        const user = await User.findById(userId).select('points trainingProgress badges certificates');
        
        // Get quiz statistics
        const quizStats = await QuizResult.getUserStats(userId);
        
        // Get user's rank
        const rank = await User.countDocuments({
            points: { $gt: user.points },
            isActive: true
        });

        const stats = {
            points: user.points,
            trainingProgress: user.trainingProgress,
            rank: rank + 1,
            badges: user.badges.length,
            certificates: user.certificates.length,
            quizStats: quizStats[0] || {
                totalQuizzes: 0,
                averageScore: 0,
                totalPoints: 0,
                passedQuizzes: 0,
                totalTimeSpent: 0
            }
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Update user role (Manager only)
router.put('/:userId/role', requireManager, [
    body('role').isIn(['user', 'manager', 'admin']).withMessage('Invalid role')
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

        const { userId } = req.params;
        const { role } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User role updated successfully',
            user
        });

    } catch (error) {
        console.error('Update user role error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user role',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Deactivate user (Manager only)
router.put('/:userId/deactivate', requireManager, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: false },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully',
            user
        });

    } catch (error) {
        console.error('Deactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to deactivate user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Reactivate user (Manager only)
router.put('/:userId/reactivate', requireManager, async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findByIdAndUpdate(
            userId,
            { isActive: true },
            { new: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User reactivated successfully',
            user
        });

    } catch (error) {
        console.error('Reactivate user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reactivate user',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Add points to user (Manager only)
router.put('/:userId/points', requireManager, [
    body('points').isNumeric().withMessage('Points must be a number')
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

        const { userId } = req.params;
        const { points } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        await user.addPoints(parseInt(points));

        res.json({
            success: true,
            message: 'Points added successfully',
            user: {
                id: user._id,
                username: user.username,
                points: user.points
            }
        });

    } catch (error) {
        console.error('Add points error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add points',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router; 