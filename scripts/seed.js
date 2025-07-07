const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Quiz = require('../models/Quiz');

// Sample quiz data
const sampleQuizzes = [
    {
        title: "Student Communication Skills",
        description: "Test your communication skills as a student",
        role: "student",
        difficulty: "beginner",
        category: "communication",
        questions: [
            {
                question: "As a student, how do you best handle group project conflicts?",
                options: [
                    "Avoid confrontation and work alone",
                    "Listen to all perspectives and find common ground",
                    "Always agree with the majority",
                    "Let the professor handle it"
                ],
                correctAnswer: 1,
                explanation: "Effective conflict resolution involves listening to all perspectives and finding common ground.",
                points: 10
            },
            {
                question: "When presenting in class, what's most important?",
                options: [
                    "Speaking as fast as possible to finish quickly",
                    "Clear communication and engaging the audience",
                    "Using complex vocabulary to impress",
                    "Reading directly from slides"
                ],
                correctAnswer: 1,
                explanation: "Clear communication and audience engagement are key to effective presentations.",
                points: 10
            },
            {
                question: "How do you manage your time effectively as a student?",
                options: [
                    "Procrastinate until the last minute",
                    "Create a schedule and prioritize tasks",
                    "Only focus on easy assignments first",
                    "Wait for others to remind you of deadlines"
                ],
                correctAnswer: 1,
                explanation: "Creating a schedule and prioritizing tasks is essential for effective time management.",
                points: 10
            }
        ],
        timeLimit: 15,
        passingScore: 70
    },
    {
        title: "Manager Leadership Skills",
        description: "Test your leadership and management skills",
        role: "manager",
        difficulty: "intermediate",
        category: "leadership",
        questions: [
            {
                question: "As a manager, how do you motivate underperforming team members?",
                options: [
                    "Criticize them publicly to set an example",
                    "Provide constructive feedback and support",
                    "Ignore the issue and hope it resolves itself",
                    "Immediately consider termination"
                ],
                correctAnswer: 1,
                explanation: "Providing constructive feedback and support is the most effective approach.",
                points: 10
            },
            {
                question: "When making important decisions, you should:",
                options: [
                    "Make quick decisions without consultation",
                    "Gather input from stakeholders and analyze data",
                    "Always go with your first instinct",
                    "Delay decisions until someone else makes them"
                ],
                correctAnswer: 1,
                explanation: "Gathering input and analyzing data leads to better decisions.",
                points: 10
            },
            {
                question: "How do you handle conflicts between team members?",
                options: [
                    "Take sides with the person you like more",
                    "Facilitate open dialogue and find solutions",
                    "Ignore the conflict and hope it goes away",
                    "Separate the team members permanently"
                ],
                correctAnswer: 1,
                explanation: "Facilitating open dialogue helps resolve conflicts effectively.",
                points: 10
            }
        ],
        timeLimit: 20,
        passingScore: 70
    },
    {
        title: "Client Relationship Management",
        description: "Test your client relationship and communication skills",
        role: "client",
        difficulty: "intermediate",
        category: "communication",
        questions: [
            {
                question: "As a client, how do you communicate your needs effectively?",
                options: [
                    "Assume the service provider knows what you want",
                    "Provide clear, detailed requirements and expectations",
                    "Change requirements frequently without notice",
                    "Only communicate when problems arise"
                ],
                correctAnswer: 1,
                explanation: "Clear, detailed communication ensures your needs are understood.",
                points: 10
            },
            {
                question: "When you're unsatisfied with a service, you should:",
                options: [
                    "Immediately terminate the contract",
                    "Communicate concerns professionally and seek solutions",
                    "Write negative reviews immediately",
                    "Switch to a different provider without explanation"
                ],
                correctAnswer: 1,
                explanation: "Professional communication often leads to better solutions.",
                points: 10
            },
            {
                question: "When working with a new service provider, what's the best approach?",
                options: [
                    "Micromanage every detail of their work",
                    "Establish clear communication channels and trust their expertise",
                    "Give them complete freedom without any guidance",
                    "Compare them constantly to previous providers"
                ],
                correctAnswer: 1,
                explanation: "Clear communication and trust lead to better working relationships.",
                points: 10
            }
        ],
        timeLimit: 15,
        passingScore: 70
    }
];

// Sample users
const sampleUsers = [
    {
        username: "admin",
        email: "admin@roshdino.com",
        password: "admin123",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        points: 5000,
        trainingProgress: 100
    },
    {
        username: "manager1",
        email: "manager1@roshdino.com",
        password: "manager123",
        firstName: "Sarah",
        lastName: "Chen",
        role: "manager",
        points: 3890,
        trainingProgress: 95
    },
    {
        username: "user1",
        email: "user1@roshdino.com",
        password: "user123",
        firstName: "Alex",
        lastName: "Rivera",
        role: "user",
        points: 2450,
        trainingProgress: 75
    },
    {
        username: "user2",
        email: "user2@roshdino.com",
        password: "user123",
        firstName: "Mike",
        lastName: "Johnson",
        role: "user",
        points: 3567,
        trainingProgress: 87
    },
    {
        username: "user3",
        email: "user3@roshdino.com",
        password: "user123",
        firstName: "Emma",
        lastName: "Wilson",
        role: "user",
        points: 2234,
        trainingProgress: 65
    },
    {
        username: "mehdi_lotfian",
        email: "mehdi_lotfian@example.com",
        password: "password123",
        firstName: "mehdi_lotfian",
        lastName: "User",
        role: "user",
        points: 5330,
        trainingProgress: 100,
        trainingComplete: true,
        isActive: true,
        preferences: {
            notifications: true,
            emailUpdates: true,
            theme: "light"
        },
        badges: [
            {
                name: "Quiz Master",
                description: "Achieved 90% or higher in a contest quiz",
                earnedAt: new Date("2025-07-06T01:48:05.206Z")
            },
            {
                name: "Quiz Master",
                description: "Achieved 90% or higher in a contest quiz",
                earnedAt: new Date("2025-07-06T01:53:27.284Z")
            },
            {
                name: "Quiz Master",
                description: "Achieved 90% or higher in a contest quiz",
                earnedAt: new Date("2025-07-06T02:13:01.630Z")
            },
            {
                name: "Quiz Master",
                description: "Achieved 90% or higher in a contest quiz",
                earnedAt: new Date("2025-07-06T02:37:47.495Z")
            },
            {
                name: "Quiz Master",
                description: "Achieved 90% or higher in a contest quiz",
                earnedAt: new Date("2025-07-07T15:08:29.452Z")
            }
        ],
        certificates: [
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:38:03.046Z"),
                certificateUrl: "/certificates/6869d37b5979a0229aee97c5"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:40:47.927Z"),
                certificateUrl: "/certificates/6869d41f5979a0229aee97e2"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:44:10.096Z"),
                certificateUrl: "/certificates/6869d4ea5979a0229aee9805"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:48:05.209Z"),
                certificateUrl: "/certificates/6869d5d55979a0229aee982e"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:48:43.099Z"),
                certificateUrl: "/certificates/6869d5fb5979a0229aee985a"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:52:29.119Z"),
                certificateUrl: "/certificates/6869d6dd5979a0229aee9895"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T01:53:00.376Z"),
                certificateUrl: "/certificates/6869d6fc5979a0229aee98c4"
            },
            {
                name: "Test Quiz - Student",
                score: 100,
                issuedAt: new Date("2025-07-06T01:53:27.288Z"),
                certificateUrl: "/certificates/6869d7175979a0229aee98f3"
            },
            {
                name: "Test Quiz - Student",
                score: 100,
                issuedAt: new Date("2025-07-06T02:08:17.126Z"),
                certificateUrl: "/certificates/6869da915979a0229aee99b4"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T02:08:37.742Z"),
                certificateUrl: "/certificates/6869daa55979a0229aee9a09"
            },
            {
                name: "Test Quiz - Student",
                score: 100,
                issuedAt: new Date("2025-07-06T02:11:50.843Z"),
                certificateUrl: "/certificates/6869db6618f1b0444b499a4e"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T02:12:14.206Z"),
                certificateUrl: "/certificates/6869db7e18f1b0444b499ab0"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-06T02:13:01.637Z"),
                certificateUrl: "/certificates/6869dbad18f1b0444b499b1a"
            },
            {
                name: "Client Relationship Management - Client",
                score: 100,
                issuedAt: new Date("2025-07-06T02:37:47.499Z"),
                certificateUrl: "/certificates/6869e17b18f1b0444b499dc5"
            },
            {
                name: "Manager Leadership Skills - Manager",
                score: 100,
                issuedAt: new Date("2025-07-07T15:08:29.459Z"),
                certificateUrl: "/certificates/686be2ed102efabd12e04ac1"
            }
        ]
    },
    {
        username: "mlotfian",
        email: "mlotfian@example.com",
        password: "password123",
        firstName: "mlotfian",
        lastName: "User",
        role: "manager",
        points: 0,
        trainingProgress: 100,
        trainingComplete: true,
        isActive: true,
        preferences: {
            notifications: true,
            emailUpdates: true,
            theme: "light"
        },
        badges: [],
        certificates: [
            {
                name: "Test Quiz - Student",
                score: 100,
                issuedAt: new Date("2025-07-07T15:17:25.208Z"),
                certificateUrl: "/certificates/686be505102efabd12e04c93"
            },
            {
                name: "Test Quiz - Student",
                score: 100,
                issuedAt: new Date("2025-07-07T15:17:40.033Z"),
                certificateUrl: "/certificates/686be514102efabd12e04ca9"
            }
        ]
    }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/roshdino', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Seed function
async function seedDatabase() {
    try {
        console.log('🌱 Starting database seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Quiz.deleteMany({});
        console.log('🗑️  Cleared existing data');

        // Create sample users
        console.log('👥 Creating sample users...');
        const createdUsers = [];
        for (const userData of sampleUsers) {
            const user = new User(userData);
            await user.save();
            createdUsers.push(user);
            console.log(`✅ Created user: ${user.username}`);
        }

        // Create sample quizzes
        console.log('📝 Creating sample quizzes...');
        for (const quizData of sampleQuizzes) {
            // Assign a random user as creator
            const randomUser = createdUsers[Math.floor(Math.random() * createdUsers.length)];
            quizData.createdBy = randomUser._id;
            
            const quiz = new Quiz(quizData);
            await quiz.save();
            console.log(`✅ Created quiz: ${quiz.title}`);
        }

        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`- ${createdUsers.length} users created`);
        console.log(`- ${sampleQuizzes.length} quizzes created`);
        console.log('\n🔑 Default Login Credentials:');
        console.log('Admin: admin / admin123');
        console.log('Manager: manager1 / manager123');
        console.log('Manager: mlotfian / password123');
        console.log('User: user1 / user123');
        console.log('User: mehdi_lotfian / password123');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

// Run the seed function
seedDatabase(); 