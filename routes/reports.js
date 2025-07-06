const express = require('express');
const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizResult = require('../models/QuizResult');
const { requireManager } = require('../middleware/auth');

const router = express.Router();

// Get learning progress report (for tests)
router.get('/learning-progress', requireManager, async (req, res) => {
    try {
        // Get user statistics
        const userStats = await User.getUserStats();
        
        // Get quiz statistics
        const quizStats = await Quiz.getQuizStats();
        
        // Get role distribution
        const roleDistribution = await User.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    averagePoints: { $avg: '$points' },
                    averageProgress: { $avg: '$trainingProgress' }
                }
            }
        ]);

        res.json({
            success: true,
            userStats: userStats[0] || {},
            quizStats,
            roleDistribution
        });

    } catch (error) {
        console.error('Get learning progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get learning progress',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user analytics (for tests)
router.get('/user-analytics', requireManager, async (req, res) => {
    try {
        // Get user statistics
        const userStats = await User.getUserStats();
        
        // Get recent activity
        const recentActivity = await QuizResult.getRecentActivity(10);
        
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

        res.json({
            success: true,
            userStats: userStats[0] || {},
            recentActivity,
            progressCategories
        });

    } catch (error) {
        console.error('Get user analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get comprehensive platform overview
router.get('/overview', requireManager, async (req, res) => {
    try {
        // Get user statistics
        const userStats = await User.getUserStats();
        
        // Get quiz statistics
        const quizStats = await Quiz.getQuizStats();
        
        // Get recent activity
        const recentActivity = await QuizResult.getRecentActivity(10);
        
        // Get role distribution
        const roleDistribution = await User.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    averagePoints: { $avg: '$points' },
                    averageProgress: { $avg: '$trainingProgress' }
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

        // Get weekly activity
        const weeklyActivity = await QuizResult.aggregate([
            {
                $match: {
                    completedAt: {
                        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$completedAt'
                        }
                    },
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        const overview = {
            users: userStats[0] || {
                totalUsers: 0,
                averagePoints: 0,
                averageProgress: 0,
                totalPoints: 0
            },
            quizzes: quizStats,
            roleDistribution,
            progressCategories,
            weeklyActivity,
            recentActivity
        };

        res.json({
            success: true,
            overview
        });

    } catch (error) {
        console.error('Get overview error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get overview',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get user performance report
router.get('/user-performance', requireManager, async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Get user details
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's quiz statistics
        const quizStats = await QuizResult.getUserStats(userId);
        
        // Get user's quiz history
        const quizHistory = await QuizResult.getUserHistory(userId, 50);
        
        // Get user's rank
        const rank = await User.countDocuments({
            points: { $gt: user.points },
            isActive: true
        });

        // Get performance by role
        const performanceByRole = await QuizResult.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    totalPoints: { $sum: '$pointsEarned' },
                    passedCount: { $sum: { $cond: ['$passed', 1, 0] } }
                }
            }
        ]);

        // Get performance by game mode
        const performanceByMode = await QuizResult.aggregate([
            { $match: { user: user._id } },
            {
                $group: {
                    _id: '$gameMode',
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    totalPoints: { $sum: '$pointsEarned' }
                }
            }
        ]);

        const performance = {
            user,
            rank: rank + 1,
            quizStats: quizStats[0] || {
                totalQuizzes: 0,
                averageScore: 0,
                totalPoints: 0,
                passedQuizzes: 0,
                totalTimeSpent: 0
            },
            quizHistory,
            performanceByRole,
            performanceByMode
        };

        res.json({
            success: true,
            performance
        });

    } catch (error) {
        console.error('Get user performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user performance',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get quiz performance report
router.get('/quiz-performance', requireManager, async (req, res) => {
    try {
        const { quizId } = req.query;

        if (!quizId) {
            return res.status(400).json({
                success: false,
                message: 'Quiz ID is required'
            });
        }

        // Get quiz details
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            return res.status(404).json({
                success: false,
                message: 'Quiz not found'
            });
        }

        // Get quiz results
        const results = await QuizResult.find({ quiz: quizId })
            .populate('user', 'username firstName lastName')
            .sort({ score: -1 });

        // Get statistics
        const stats = await QuizResult.aggregate([
            { $match: { quiz: quiz._id } },
            {
                $group: {
                    _id: null,
                    totalAttempts: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    highestScore: { $max: '$score' },
                    lowestScore: { $min: '$score' },
                    passedAttempts: { $sum: { $cond: ['$passed', 1, 0] } },
                    averageTime: { $avg: '$timeSpent' }
                }
            }
        ]);

        // Get performance by role
        const performanceByRole = await QuizResult.aggregate([
            { $match: { quiz: quiz._id } },
            {
                $group: {
                    _id: '$role',
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    passedCount: { $sum: { $cond: ['$passed', 1, 0] } }
                }
            }
        ]);

        // Get performance by game mode
        const performanceByMode = await QuizResult.aggregate([
            { $match: { quiz: quiz._id } },
            {
                $group: {
                    _id: '$gameMode',
                    count: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    totalPoints: { $sum: '$pointsEarned' }
                }
            }
        ]);

        const performance = {
            quiz,
            stats: stats[0] || {
                totalAttempts: 0,
                averageScore: 0,
                highestScore: 0,
                lowestScore: 0,
                passedAttempts: 0,
                averageTime: 0
            },
            results,
            performanceByRole,
            performanceByMode
        };

        res.json({
            success: true,
            performance
        });

    } catch (error) {
        console.error('Get quiz performance error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get quiz performance',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get engagement analytics
router.get('/engagement', requireManager, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const startDate = new Date(Date.now() - parseInt(days) * 24 * 60 * 60 * 1000);

        // Daily activity
        const dailyActivity = await QuizResult.aggregate([
            {
                $match: {
                    completedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$completedAt'
                        }
                    },
                    attempts: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$user' },
                    averageScore: { $avg: '$score' }
                }
            },
            {
                $project: {
                    date: '$_id',
                    attempts: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    averageScore: { $round: ['$averageScore', 2] }
                }
            },
            { $sort: { date: 1 } }
        ]);

        // User engagement by role
        const engagementByRole = await QuizResult.aggregate([
            {
                $match: {
                    completedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$role',
                    totalAttempts: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$user' },
                    averageScore: { $avg: '$score' }
                }
            },
            {
                $project: {
                    role: '$_id',
                    totalAttempts: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                    averageScore: { $round: ['$averageScore', 2] }
                }
            }
        ]);

        // Most active users
        const mostActiveUsers = await QuizResult.aggregate([
            {
                $match: {
                    completedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: '$user',
                    attempts: { $sum: 1 },
                    totalPoints: { $sum: '$pointsEarned' },
                    averageScore: { $avg: '$score' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    username: '$userDetails.username',
                    firstName: '$userDetails.firstName',
                    lastName: '$userDetails.lastName',
                    attempts: 1,
                    totalPoints: 1,
                    averageScore: { $round: ['$averageScore', 2] }
                }
            },
            { $sort: { attempts: -1 } },
            { $limit: 10 }
        ]);

        const engagement = {
            dailyActivity,
            engagementByRole,
            mostActiveUsers,
            period: `${days} days`
        };

        res.json({
            success: true,
            engagement
        });

    } catch (error) {
        console.error('Get engagement error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get engagement analytics',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Get learning progress report
router.get('/learning-progress', requireManager, async (req, res) => {
    try {
        // Get training progress distribution
        const progressDistribution = await User.aggregate([
            { $match: { isActive: true } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $lt: ['$trainingProgress', 25] },
                            'Beginner (0-25%)',
                            {
                                $cond: [
                                    { $lt: ['$trainingProgress', 50] },
                                    'Intermediate (26-50%)',
                                    {
                                        $cond: [
                                            { $lt: ['$trainingProgress', 75] },
                                            'Advanced (51-75%)',
                                            'Expert (76-100%)'
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    count: { $sum: 1 },
                    averagePoints: { $avg: '$points' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get users who completed training
        const completedTraining = await User.find({
            isActive: true,
            trainingProgress: { $gte: 100 }
        }).select('username firstName lastName points trainingProgress');

        // Get users with high scores
        const highPerformers = await QuizResult.aggregate([
            {
                $group: {
                    _id: '$user',
                    averageScore: { $avg: '$score' },
                    totalQuizzes: { $sum: 1 }
                }
            },
            {
                $match: {
                    averageScore: { $gte: 85 },
                    totalQuizzes: { $gte: 3 }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            {
                $unwind: '$userDetails'
            },
            {
                $project: {
                    username: '$userDetails.username',
                    firstName: '$userDetails.firstName',
                    lastName: '$userDetails.lastName',
                    averageScore: { $round: ['$averageScore', 2] },
                    totalQuizzes: 1
                }
            },
            { $sort: { averageScore: -1 } },
            { $limit: 20 }
        ]);

        // Get learning trends
        const learningTrends = await QuizResult.aggregate([
            {
                $group: {
                    _id: {
                        month: { $month: '$completedAt' },
                        year: { $year: '$completedAt' }
                    },
                    totalAttempts: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    uniqueUsers: { $addToSet: '$user' }
                }
            },
            {
                $project: {
                    month: '$_id.month',
                    year: '$_id.year',
                    totalAttempts: 1,
                    averageScore: { $round: ['$averageScore', 2] },
                    uniqueUsers: { $size: '$uniqueUsers' }
                }
            },
            { $sort: { year: 1, month: 1 } },
            { $limit: 12 }
        ]);

        const learningProgress = {
            progressDistribution,
            completedTraining,
            highPerformers,
            learningTrends
        };

        res.json({
            success: true,
            learningProgress
        });

    } catch (error) {
        console.error('Get learning progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get learning progress',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Export report data
router.get('/export/:type', requireManager, async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'json' } = req.query;

        let data;

        switch (type) {
            case 'users':
                data = await User.find({ isActive: true })
                    .select('-password')
                    .lean();
                break;
            case 'quiz-results':
                data = await QuizResult.find()
                    .populate('user', 'username firstName lastName')
                    .populate('quiz', 'title role difficulty')
                    .lean();
                break;
            case 'quizzes':
                data = await Quiz.find({ isActive: true }).lean();
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid export type'
                });
        }

        if (format === 'csv') {
            // Convert to CSV format
            const csv = convertToCSV(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}-${Date.now()}.csv`);
            res.send(csv);
        } else {
            res.json({
                success: true,
                data,
                count: data.length
            });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export data',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

// Helper function to convert data to CSV
const convertToCSV = (data) => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
        const values = headers.map(header => {
            const value = row[header];
            return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
};

module.exports = router; 