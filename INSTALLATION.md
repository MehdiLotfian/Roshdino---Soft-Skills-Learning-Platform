# 🚀 Roshdino Installation Guide

## ✅ Pre-Installation Checklist

### Required Software
- [ ] **Node.js** (v16.0.0 or higher)
  - Download from: https://nodejs.org/
  - Verify: `node --version`
- [ ] **MongoDB** (v4.4 or higher)
  - Download from: https://www.mongodb.com/try/download/community
  - Or use MongoDB Atlas (cloud)
  - Verify: `mongod --version`

### Project Files Check
- [ ] All files are present in the project directory
- [ ] `package.json` exists with all dependencies
- [ ] `server.js` is the main entry point
- [ ] All route files are in the `routes/` directory
- [ ] All model files are in the `models/` directory
- [ ] Frontend `index.html` is in the `public/` directory

## 📋 Installation Steps

### Step 1: Install Node.js
1. Go to https://nodejs.org/
2. Download the LTS version (v18 or higher)
3. Run the installer
4. Verify installation:
   ```bash
   node --version
   npm --version
   ```

### Step 2: Install MongoDB
**Option A: Local MongoDB**
1. Go to https://www.mongodb.com/try/download/community
2. Download MongoDB Community Server
3. Run the installer
4. Start MongoDB service:
   ```bash
   mongod
   ```

**Option B: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/atlas
2. Create a free account
3. Create a new cluster
4. Get your connection string

### Step 3: Project Setup
1. **Navigate to project directory:**
   ```bash
   cd "F:\uni\System Analysis Project"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   copy env.example .env
   ```

4. **Configure environment variables:**
   Edit `.env` file with your settings:
   ```env
   # Server Configuration
   PORT=3000
   NODE_ENV=development

   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/roshdino
   # OR for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roshdino

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Email Configuration (optional)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password

   # File Upload Configuration
   UPLOAD_PATH=./uploads
   MAX_FILE_SIZE=5242880

   # Rate Limiting
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=100

   # Security
   BCRYPT_ROUNDS=12
   ```

### Step 4: Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Copy the output and update `JWT_SECRET` in your `.env` file.

### Step 5: Start MongoDB
**For Local MongoDB:**
```bash
mongod
```

**For MongoDB Atlas:**
No local setup needed, just ensure your connection string is correct.

### Step 6: Seed the Database (Optional)
```bash
npm run seed
```
This will create sample users and quizzes.

### Step 7: Start the Application
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

## 🎯 Verification Steps

### 1. Check Server Status
- Open browser to: http://localhost:3000
- You should see the Roshdino login page

### 2. Test API Endpoints
- API base URL: http://localhost:3000/api
- Test login: POST http://localhost:3000/api/auth/login

### 3. Check Database Connection
- Look for "Connected to MongoDB" in console logs
- If using seeded data, you can login with accounts listed in LOGIN_GUIDE.md:
  - Admin: `admin` / `admin123`
  - Manager: `mlotfian` / `password123` or `manager1` / `manager123`
  - User: `mehdi_lotfian` / `password123` or `user1` / `user123`

## 🔧 Troubleshooting

### Common Issues

**1. Node.js not found**
```bash
# Install Node.js from nodejs.org
# Verify installation
node --version
npm --version
```

**2. MongoDB connection error**
```bash
# Check if MongoDB is running
mongod --version

# Start MongoDB service
mongod

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/roshdino
```

**3. Port already in use**
```bash
# Change port in .env
PORT=3001

# Or kill process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**4. Module not found errors**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**5. JWT errors**
```bash
# Generate new JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Update JWT_SECRET in .env
```

## 📊 Project Structure Verification

```
System Analysis Project/
├── server.js                 ✅ Main server file
├── package.json             ✅ Dependencies
├── .env                     ✅ Environment variables
├── README.md               ✅ Documentation
├── INSTALLATION.md         ✅ This file
├── models/                 ✅ Database models
│   ├── User.js            ✅ User model
│   ├── Quiz.js            ✅ Quiz model
│   └── QuizResult.js      ✅ Quiz results model
├── middleware/             ✅ Custom middleware
│   └── auth.js            ✅ Authentication middleware
├── routes/                 ✅ API routes
│   ├── auth.js            ✅ Authentication routes
│   ├── quizzes.js         ✅ Quiz management
│   ├── leaderboard.js     ✅ Leaderboard routes
│   ├── certificates.js    ✅ Certificate routes
│   ├── users.js           ✅ User management
│   └── reports.js         ✅ Analytics routes
├── scripts/               ✅ Utility scripts
│   └── seed.js           ✅ Database seeding
├── public/                ✅ Frontend files
│   └── index.html        ✅ Main application
└── uploads/              ✅ File uploads
    └── certificates/     ✅ Generated certificates
```

## 🎉 Success Indicators

- ✅ Server starts without errors
- ✅ MongoDB connection established
- ✅ Frontend loads at http://localhost:3000
- ✅ API endpoints respond correctly
- ✅ User login works
- ✅ Quiz functionality works
- ✅ Leaderboard displays correctly

## 🚀 Next Steps

1. **Explore the Application:**
   - Register a new user
   - Take quizzes
   - Check leaderboards
   - Generate certificates

2. **Test Manager Features:**
   - Login as manager1 / manager123
   - Access reports and analytics
   - Manage users and quizzes

3. **Customize the Platform:**
   - Add new quizzes
   - Modify user roles
   - Customize certificates
   - Update branding

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify all prerequisites are installed
4. Ensure environment variables are correct

---

**🎯 Installation Complete!** Your Roshdino platform is ready to use! 🐬 