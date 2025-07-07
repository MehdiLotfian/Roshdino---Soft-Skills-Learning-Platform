# 🐬 Roshdino - Soft Skills Learning Platform

A comprehensive web-based platform for learning and practicing soft skills through interactive quizzes, role-based scenarios, and gamified learning experiences.

## 🌟 Features

### 🎮 Interactive Learning
- **Practice Mode**: Risk-free environment for skill development
- **Contest Mode**: Competitive quizzes with points and leaderboards
- **Role-Based Scenarios**: Student, Manager, and Client perspectives
- **Training Phase**: Progressive learning with completion tracking

### 📊 Analytics & Progress
- **Real-time Progress Tracking**: Visual progress bars and completion rates
- **Quiz History**: Detailed history of all quiz attempts
- **Leaderboards**: Global and role-specific rankings
- **Manager Reports**: Comprehensive analytics for administrators

### 🏆 Gamification
- **Points System**: Earn points through successful quiz completion
- **Achievement Badges**: Recognition for high performance
- **Certificates**: Downloadable certificates upon completion
- **Notifications**: Real-time updates and reminders

### 👥 User Management
- **Multi-Role Support**: User and Manager roles
- **Authentication**: Secure JWT-based login system
- **Profile Management**: Personal progress and statistics

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Jest** - Testing framework

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with modern gradients and animations
- **JavaScript (ES6+)** - Client-side functionality
- **Chart.js** - Data visualization

### Development Tools
- **Git** - Version control
- **npm** - Package management
- **Supertest** - API testing

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd roshdino
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   Edit `.env` file with your configuration:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/roshdino
   JWT_SECRET=your-secret-key
   NODE_ENV=development
   ```

4. **Database Setup**
   ```bash
   npm run seed
   ```

5. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Use the provided test accounts (see LOGIN_GUIDE.md for details)

## 📖 Usage

### Quick Start
- See `LOGIN_GUIDE.md` for available login accounts and detailed usage instructions

### For Users
1. **Login** with your credentials
2. **Complete Training Phase** to unlock the main contest
3. **Choose Game Mode**: Practice or Contest
4. **Select Role**: Student, Manager, or Client
5. **Take Quizzes** and earn points
6. **Track Progress** through the dashboard
7. **View History** of all quiz attempts
8. **Download Certificates** upon completion

### For Managers
1. **Login** with manager credentials
2. **Access Reports** for comprehensive analytics
3. **Monitor User Progress** across all roles
4. **View Leaderboards** and statistics
5. **Generate Reports** for insights

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run specific test files:
```bash
npm test -- --testNamePattern="auth"
```

## 📁 Project Structure

```
roshdino/
├── models/              # Database models
│   ├── User.js
│   ├── Quiz.js
│   ├── QuizResult.js
│   └── Notification.js
├── routes/              # API routes
│   ├── auth.js
│   ├── quizzes.js
│   ├── leaderboard.js
│   ├── certificates.js
│   ├── notifications.js
│   ├── reports.js
│   └── users.js
├── middleware/          # Custom middleware
│   └── auth.js
├── scripts/            # Utility scripts
│   ├── seed.js
│   └── verify.js
├── test/              # Test files
│   └── api.test.js
├── public/            # Static files
│   ├── index.html
│   └── chart.min.js
├── uploads/           # File uploads
│   └── certificates/
├── server.js          # Main server file
├── package.json       # Dependencies and scripts
├── README.md         # This file
├── LOGIN_GUIDE.md    # User login information
├── INSTALLATION.md   # Installation guide
└── BACKEND_REPORT.md # Backend implementation report
```

## 🔧 Configuration

### Environment Variables
- `PORT`: Server port (default: 3000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `NODE_ENV`: Environment (development/production)

### Database Models
- **User**: Authentication and profile data
- **Quiz**: Quiz questions and metadata
- **QuizResult**: User quiz attempts and scores
- **Notification**: System notifications

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker (Optional)
```bash
docker build -t roshdino .
docker run -p 3000:3000 roshdino
```

## 🔄 Recent Updates

### Latest Changes
- **Removed Registration**: User registration has been disabled - only login is available
- **Enhanced Seed Data**: Added comprehensive user accounts with full progress data
- **Updated Documentation**: All markdown files updated to reflect current functionality
- **Login Guide**: Created detailed `LOGIN_GUIDE.md` with all available accounts

### Available Accounts
- **mehdi_lotfian** / password123 (User with 5,330 points)
- **mlotfian** / password123 (Manager)
- **admin** / admin123 (Admin)
- Plus additional test accounts (see LOGIN_GUIDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Designed for educational purposes
- Focused on user experience and accessibility

## 📞 Support

For support, create an issue in this repository.

---

**Made with ❤️ for learning and development** 
