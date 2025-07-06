const express = require('express');
const User = require('../models/User');
const QuizResult = require('../models/QuizResult');

const router = express.Router();

// Get global leaderboard
router.get('/global', async (req, res) => {
    try {
        const { limit = 10, role } = req.query;
        
        let query = { isActive: true };
        if (role) query.role = role;

        const leaderboard = await User.find(query)
            .select('username firstName lastName points role trainingProgress')
            .sort({ points: -1 })
            .limit(parseInt(limit));

        // Add rank to each user
        const leaderboardWithRank = leaderboard.map((user, index) => ({
            rank: index + 1,
            ...user.toObject()
        }));

        res.json({
            success: true,
            leaderboard: leaderboardWithRank
        });

    } catch (error) {
        console.error('Get global leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get leaderboard',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user's rank
router.get('/user-rank', async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get user's points
        const user = await User.findById(userId).select('points');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Count users with more points
        const rank = await User.countDocuments({
            points: { $gt: user.points },
            isActive: true
        });

        const userRank = rank + 1;

        res.json({
            success: true,
            rank: userRank,
            points: user.points
        });

    } catch (error) {
        console.error('Get user rank error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user rank',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get role-based leaderboard
router.get('/role/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const { limit = 10 } = req.query;

        const leaderboard = await User.find({
            role,
            isActive: true
        })
        .select('username firstName lastName points trainingProgress')
        .sort({ points: -1 })
        .limit(parseInt(limit));

        // Add rank to each user
        const leaderboardWithRank = leaderboard.map((user, index) => ({
            rank: index + 1,
            ...user.toObject()
        }));

        res.json({
            success: true,
            role,
            leaderboard: leaderboardWithRank
        });

    } catch (error) {
        console.error('Get role leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get role leaderboard',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get quiz-specific leaderboard
router.get('/quiz/:quizId', async (req, res) => {
    try {
        const { quizId } = req.params;
        const { limit = 10 } = req.query;

        const leaderboard = await QuizResult.find({
            quiz: quizId,
            gameMode: 'contest'
        })
        .populate('user', 'username firstName lastName')
        .sort({ score: -1, timeSpent: 1 })
        .limit(parseInt(limit));

        // Add rank to each result
        const leaderboardWithRank = leaderboard.map((result, index) => ({
            rank: index + 1,
            user: result.user,
            score: result.score,
            timeSpent: result.timeSpent,
            completedAt: result.completedAt
        }));

        res.json({
            success: true,
            quizId,
            leaderboard: leaderboardWithRank
        });

    } catch (error) {
        console.error('Get quiz leaderboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get quiz leaderboard',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user statistics
router.get('/user-stats', async (req, res) => {
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

// Get platform statistics (Manager only)
router.get('/platform-stats', async (req, res) => {
    try {
        // Get user statistics
        const userStats = await User.getUserStats();
        
        // Get quiz statistics
        const quizStats = await QuizResult.aggregate([
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    totalPoints: { $sum: '$pointsEarned' },
                    passedAttempts: { $sum: { $cond: ['$passed', 1, 0] } }
                }
            }
        ]);

        // Get role distribution
        const roleDistribution = await User.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get progress categories
        const progressCategories = await User.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ['$trainingProgress', 25] },
                            'Beginner',
                            {
                                $cond: [
                                    { $lt: ['$trainingProgress', 50] },
                                    'Intermediate',
                                    {
                                        $cond: [
                                            { $lt: ['$trainingProgress', 75] },
                                            'Advanced',
                                            'Expert'
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    count: { $sum: 1 }
                }
            }
        ]);

        const stats = {
            users: userStats[0] || {
                totalUsers: 0,
                averagePoints: 0,
                averageProgress: 0,
                totalPoints: 0
            },
            quizzes: quizStats[0] || {
                totalAttempts: 0,
                averageScore: 0,
                totalPoints: 0,
                passedAttempts: 0
            },
            roleDistribution,
            progressCategories
        };

        res.json({
            success: true,
            stats
        });

    } catch (error) {
        console.error('Get platform stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get platform statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get recent activity
router.get('/recent-activity', async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        const recentActivity = await QuizResult.getRecentActivity(parseInt(limit));

        res.json({
            success: true,
            recentActivity
        });

    } catch (error) {
        console.error('Get recent activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get recent activity',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

module.exports = router; 