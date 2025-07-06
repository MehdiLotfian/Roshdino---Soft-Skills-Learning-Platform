const mongoose = require('mongoose');

const quizResultSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quiz: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    pointsEarned: {
        type: Number,
        default: 0
    },
    answers: [{
        questionIndex: Number,
        selectedAnswer: Number,
        isCorrect: Boolean,
        timeSpent: Number // in seconds
    }],
    gameMode: {
        type: String,
        enum: ['practice', 'contest'],
        default: 'practice'
    },
    role: {
        type: String,
        enum: ['student', 'manager', 'client'],
        required: true
    },
    timeSpent: {
        type: Number, // total time in seconds
        default: 0
    },
    completedAt: {
        type: Date,
        default: Date.now
    },
    passed: {
        type: Boolean,
        default: false
    },
    feedback: {
        type: String,
        trim: true
    },
    certificateEligible: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
quizResultSchema.index({ user: 1, completedAt: -1 });
quizResultSchema.index({ quiz: 1, score: -1 });
quizResultSchema.index({ gameMode: 1 });
quizResultSchema.index({ role: 1 });

// Virtual for time spent in minutes
quizResultSchema.virtual('timeSpentMinutes').get(function() {
    return Math.round(this.timeSpent / 60 * 100) / 100;
});

// Method to calculate performance metrics
quizResultSchema.methods.calculatePerformance = function() {
    const correctAnswers = this.answers.filter(answer => answer.isCorrect).length;
    const totalQuestions = this.answers.length;
    const accuracy = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    
    return {
        accuracy: Math.round(accuracy),
        correctAnswers,
        totalQuestions,
        averageTimePerQuestion: this.timeSpent / totalQuestions
    };
};

// Static method to get user's quiz history
quizResultSchema.statics.getUserHistory = function(userId, limit = 20) {
    return this.find({ user: userId })
        .populate('quiz', 'title role difficulty')
        .sort({ completedAt: -1 })
        .limit(limit);
};

// Static method to get leaderboard for a specific quiz
quizResultSchema.statics.getQuizLeaderboard = function(quizId, limit = 10) {
    return this.find({ quiz: quizId, gameMode: 'contest' })
        .populate('user', 'username firstName lastName')
        .sort({ score: -1, timeSpent: 1 })
        .limit(limit);
};

// Static method to get user statistics
quizResultSchema.statics.getUserStats = function(userId) {
    return this.aggregate([
        { $match: { user: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                totalQuizzes: { $sum: 1 },
                averageScore: { $avg: '$score' },
                totalPoints: { $sum: '$pointsEarned' },
                passedQuizzes: { $sum: { $cond: ['$passed', 1, 0] } },
                totalTimeSpent: { $sum: '$timeSpent' }
            }
        }
    ]);
};

// Static method to get role-based statistics
quizResultSchema.statics.getRoleStats = function(role) {
    return this.aggregate([
        { $match: { role } },
        {
            $group: {
                _id: '$gameMode',
                count: { $sum: 1 },
                averageScore: { $avg: '$score' },
                averageTime: { $avg: '$timeSpent' },
                passedCount: { $sum: { $cond: ['$passed', 1, 0] } }
            }
        }
    ]);
};

// Static method to get recent activity
quizResultSchema.statics.getRecentActivity = function(limit = 10) {
    return this.find()
        .populate('user', 'username firstName lastName')
        .populate('quiz', 'title role')
        .sort({ completedAt: -1 })
        .limit(limit);
};

module.exports = mongoose.model('QuizResult', quizResultSchema); 