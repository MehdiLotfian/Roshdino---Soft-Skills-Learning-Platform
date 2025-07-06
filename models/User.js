const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['user', 'manager', 'admin'],
        default: 'user'
    },
    firstName: {
        type: String,
        required: true,
        trim: true
    },
    lastName: {
        type: String,
        required: true,
        trim: true
    },
    points: {
        type: Number,
        default: 0
    },
    trainingProgress: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    trainingComplete: {
        type: Boolean,
        default: false
    },
    badges: [{
        name: String,
        description: String,
        earnedAt: {
            type: Date,
            default: Date.now
        }
    }],
    certificates: [{
        name: String,
        score: Number,
        issuedAt: {
            type: Date,
            default: Date.now
        },
        certificateUrl: String
    }],
    quizHistory: [{
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz'
        },
        score: Number,
        completedAt: {
            type: Date,
            default: Date.now
        },
        gameMode: {
            type: String,
            enum: ['practice', 'contest'],
            default: 'practice'
        },
        role: {
            type: String,
            enum: ['student', 'manager', 'client'],
            required: true
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    profilePicture: {
        type: String,
        default: null
    },
    preferences: {
        notifications: {
            type: Boolean,
            default: true
        },
        emailUpdates: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            enum: ['light', 'dark'],
            default: 'light'
        }
    }
}, {
    timestamps: true
});

// Index for better query performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ points: -1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`;
});

// Virtual for rank (calculated based on points)
userSchema.virtual('rank').get(function() {
    // This will be calculated dynamically in queries
    return null;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS) || 12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// Method to add points
userSchema.methods.addPoints = function(points) {
    this.points += points;
    return this.save();
};

// Method to update training progress
userSchema.methods.updateTrainingProgress = function(progress) {
    this.trainingProgress = Math.min(100, Math.max(0, progress));
    return this.save();
};

// Method to add badge
userSchema.methods.addBadge = function(badgeName, description) {
    this.badges.push({
        name: badgeName,
        description: description
    });
    return this.save();
};

// Method to add certificate
userSchema.methods.addCertificate = function(certificateData) {
    this.certificates.push(certificateData);
    return this.save();
};

// Method to add quiz result
userSchema.methods.addQuizResult = function(quizData) {
    this.quizHistory.push(quizData);
    return this.save();
};

// Static method to get leaderboard
userSchema.statics.getLeaderboard = function(limit = 10) {
    return this.find({ isActive: true })
        .select('username firstName lastName points')
        .sort({ points: -1 })
        .limit(limit);
};

// Static method to get user statistics
userSchema.statics.getUserStats = function() {
    return this.aggregate([
        { $match: { isActive: true } },
        {
            $group: {
                _id: null,
                totalUsers: { $sum: 1 },
                averagePoints: { $avg: '$points' },
                averageProgress: { $avg: '$trainingProgress' },
                totalPoints: { $sum: '$points' }
            }
        }
    ]);
};

// JSON transformation
userSchema.methods.toJSON = function() {
    const user = this.toObject();
    delete user.password;
    return user;
};

module.exports = mongoose.model('User', userSchema); 