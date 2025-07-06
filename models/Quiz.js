const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
    question: {
        type: String,
        required: true,
        trim: true
    },
    options: [{
        type: String,
        required: true,
        trim: true
    }],
    correctAnswer: {
        type: Number,
        required: true,
        min: 0
    },
    explanation: {
        type: String,
        trim: true
    },
    points: {
        type: Number,
        default: 10
    }
});

const quizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    role: {
        type: String,
        enum: ['student', 'manager', 'client'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced'],
        default: 'intermediate'
    },
    questions: [questionSchema],
    timeLimit: {
        type: Number, // in minutes
        default: 30
    },
    passingScore: {
        type: Number,
        default: 70,
        min: 0,
        max: 100
    },
    isActive: {
        type: Boolean,
        default: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attempts: {
        type: Number,
        default: 0
    },
    averageScore: {
        type: Number,
        default: 0
    },
    category: {
        type: String,
        enum: ['communication', 'leadership', 'teamwork', 'problem-solving', 'time-management', 'general'],
        default: 'general'
    }
}, {
    timestamps: true
});

// Index for better query performance
quizSchema.index({ role: 1, isActive: 1 });
quizSchema.index({ category: 1 });
quizSchema.index({ difficulty: 1 });
quizSchema.index({ createdBy: 1 });

// Virtual for total points
quizSchema.virtual('totalPoints').get(function() {
    return this.questions.reduce((total, question) => total + question.points, 0);
});

// Virtual for question count
quizSchema.virtual('questionCount').get(function() {
    return this.questions.length;
});

// Method to calculate score
quizSchema.methods.calculateScore = function(answers) {
    let correctAnswers = 0;
    let totalPoints = 0;
    
    this.questions.forEach((question, index) => {
        totalPoints += question.points;
        if (answers[index] === question.correctAnswer) {
            correctAnswers += question.points;
        }
    });
    
    return {
        score: Math.round((correctAnswers / totalPoints) * 100),
        correctAnswers,
        totalPoints
    };
};

// Method to update statistics
quizSchema.methods.updateStats = function(score) {
    this.attempts += 1;
    this.averageScore = ((this.averageScore * (this.attempts - 1)) + score) / this.attempts;
    return this.save();
};

// Static method to get quizzes by role
quizSchema.statics.getByRole = function(role, limit = 10) {
    return this.find({ 
        role, 
        isActive: true 
    })
    .select('title description difficulty questionCount category')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get random quiz
quizSchema.statics.getRandomQuiz = function(role, difficulty = null) {
    const query = { role, isActive: true };
    if (difficulty) {
        query.difficulty = difficulty;
    }
    
    return this.findOne(query).sort({ attempts: 1 });
};

// Static method to get quiz statistics
quizSchema.statics.getQuizStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: '$role',
                count: { $sum: 1 },
                averageAttempts: { $avg: '$attempts' },
                averageScore: { $avg: '$averageScore' }
            }
        }
    ]);
};

module.exports = mongoose.model('Quiz', quizSchema); 