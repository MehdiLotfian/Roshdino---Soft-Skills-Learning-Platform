const request = require('supertest');
const { app, server } = require('../server');
const mongoose = require('mongoose');

const testUser = {
  username: 'testuser_roshdino',
  password: 'Test123456!',
  email: 'testuser_roshdino@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'user'
};

const testManager = {
  username: 'testmanager_roshdino',
  password: 'Test123456!',
  email: 'testmanager_roshdino@example.com',
  firstName: 'Test',
  lastName: 'Manager',
  role: 'manager'
};

let userToken;
let managerToken;
let quizId;
let notificationId;
let certificateId;

beforeAll(async () => {
  // Clean up test users before tests
  await mongoose.connection.collection('users').deleteOne({ username: testUser.username });
  await mongoose.connection.collection('users').deleteOne({ username: testManager.username });
});

afterAll(async () => {
  // Clean up test users and close server/db
  await mongoose.connection.collection('users').deleteOne({ username: testUser.username });
  await mongoose.connection.collection('users').deleteOne({ username: testManager.username });
  server.close();
  await mongoose.disconnect();
});

describe('Roshdino API Integration Tests', () => {
  describe('Authentication', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.error('Registration error:', res.body);
      }
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.success).toBe(true);
    });

    it('should register a new manager', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testManager);
      if (res.statusCode !== 200 && res.statusCode !== 201) {
        console.error('Manager registration error:', res.body);
      }
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body.success).toBe(true);
    });

    it('should login user and get a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: testUser.password,
          role: 'user'
        });
      if (res.statusCode !== 200) {
        console.error('Login error:', res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      userToken = res.body.token;
    });

    it('should login manager and get a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testManager.username,
          password: testManager.password,
          role: 'manager'
        });
      if (res.statusCode !== 200) {
        console.error('Manager login error:', res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.token).toBeDefined();
      managerToken = res.body.token;
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword',
          role: 'user'
        });
      expect(res.statusCode).toBe(401);
    });

    it('should reject registration with existing username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Quiz Management', () => {
    it('should fetch a quiz', async () => {
      const res = await request(app)
        .get('/api/quizzes/random/student')
        .set('Authorization', `Bearer ${userToken}`);
      if (res.statusCode !== 200) {
        console.error('Fetch quiz error:', res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.quiz).toBeDefined();
      quizId = res.body.quiz._id;
    });

    it('should submit quiz answers', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: [0, 0, 0],
          gameMode: 'practice',
          role: 'student',
          timeSpent: 60
        });
      if (res.statusCode !== 200) {
        console.error('Submit quiz error:', res.body);
      }
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.pointsEarned || (res.body.result && res.body.result.pointsEarned)).toBeDefined();
    });

    it('should get quiz history', async () => {
      const res = await request(app)
        .get('/api/quizzes/history')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.history)).toBe(true);
    });

    it('should get quizzes by role', async () => {
      const res = await request(app)
        .get('/api/quizzes/role/student')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.quizzes)).toBe(true);
    });

    it('should reject quiz submission without token', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/submit`)
        .send({
          answers: [0, 0, 0],
          gameMode: 'practice',
          role: 'student',
          timeSpent: 60
        });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Leaderboard', () => {
    it('should fetch global leaderboard', async () => {
      const res = await request(app)
        .get('/api/leaderboard/global')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
    });

    it('should get user rank', async () => {
      const res = await request(app)
        .get('/api/leaderboard/user-rank')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.rank).toBeDefined();
      expect(res.body.points).toBeDefined();
    });

    it('should get role-based leaderboard', async () => {
      const res = await request(app)
        .get('/api/leaderboard/role/user')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.leaderboard)).toBe(true);
    });

    it('should get user statistics', async () => {
      const res = await request(app)
        .get('/api/leaderboard/user-stats')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.stats).toBeDefined();
      expect(res.body.stats.points).toBeDefined();
    });
  });

  describe('Notifications', () => {
    it('should get user notifications', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('should mark notification as read', async () => {
      // First get notifications to find an ID
      const getRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${userToken}`);
      
      if (getRes.body.notifications.length > 0) {
        notificationId = getRes.body.notifications[0]._id;
        
        const res = await request(app)
          .put(`/api/notifications/${notificationId}/read`)
          .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
      }
    });

    it('should create notification (manager only)', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          userId: 'testuser',
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'info'
        });
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Certificates', () => {
    it('should get user certificates', async () => {
      const res = await request(app)
        .get('/api/certificates')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.certificates)).toBe(true);
    });

    it('should generate certificate', async () => {
      const res = await request(app)
        .post('/api/certificates/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          quizId: quizId,
          score: 85,
          role: 'student'
        });
      if (res.statusCode === 200) {
        certificateId = res.body.certificateId;
      }
      expect([200, 400]).toContain(res.statusCode); // 400 if not eligible
    });

    it('should download certificate', async () => {
      if (certificateId) {
        const res = await request(app)
          .get(`/api/certificates/${certificateId}/download`)
          .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
      }
    });
  });

  describe('User Management', () => {
    it('should get user profile', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.user).toBeDefined();
    });

    it('should update user profile', async () => {
      const res = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Name'
        });
      expect(res.statusCode).toBe(200);
    });

    it('should get user badges', async () => {
      const res = await request(app)
        .get('/api/users/badges')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.badges)).toBe(true);
    });

    it('should get user certificates', async () => {
      const res = await request(app)
        .get('/api/users/certificates')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.certificates)).toBe(true);
    });
  });

  describe('Manager Reports (Manager Only)', () => {
    it('should get learning progress report', async () => {
      const res = await request(app)
        .get('/api/reports/learning-progress')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get user analytics', async () => {
      const res = await request(app)
        .get('/api/reports/user-analytics')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should get quiz statistics', async () => {
      const res = await request(app)
        .get('/api/quizzes/stats/overview')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject manager endpoints for regular users', async () => {
      const res = await request(app)
        .get('/api/reports/learning-progress')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(403);
    });
  });

  describe('Quiz Management (Manager Only)', () => {
    it('should create a new quiz', async () => {
      const res = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Test Quiz',
          description: 'A test quiz for testing',
          role: 'student',
          difficulty: 'beginner',
          category: 'communication',
          questions: [
            {
              question: 'What is the best way to communicate?',
              options: ['Listen', 'Talk', 'Ignore', 'Interrupt'],
              correctAnswer: 0,
              points: 10
            }
          ]
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('should update a quiz', async () => {
      const res = await request(app)
        .put(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          title: 'Updated Quiz Title'
        });
      expect(res.statusCode).toBe(200);
    });

    it('should delete a quiz', async () => {
      const res = await request(app)
        .delete(`/api/quizzes/${quizId}`)
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.statusCode).toBe(200);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid quiz ID', async () => {
      const res = await request(app)
        .get('/api/quizzes/invalid-id')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(404);
    });

    it('should handle invalid token', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid-token');
      expect(res.statusCode).toBe(401);
    });

    it('should handle missing token', async () => {
      const res = await request(app)
        .get('/api/users/profile');
      expect(res.statusCode).toBe(401);
    });

    it('should handle invalid route', async () => {
      const res = await request(app)
        .get('/api/invalid-route')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.statusCode).toBe(404);
    });
  });

  describe('Validation', () => {
    it('should reject invalid quiz submission', async () => {
      const res = await request(app)
        .post(`/api/quizzes/${quizId}/submit`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          answers: 'invalid',
          gameMode: 'invalid',
          role: 'invalid',
          timeSpent: 'invalid'
        });
      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid user registration', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: '',
          password: '123',
          email: 'invalid-email',
          role: 'invalid'
        });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting', async () => {
      const requests = Array(105).fill().map(() => 
        request(app)
          .get('/api/users/profile')
          .set('Authorization', `Bearer ${userToken}`)
      );
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.statusCode === 429);
      expect(rateLimited).toBe(true);
    });
  });
}); 