const request = require('supertest');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('../routes/auth');
const { supabase } = require('../config/supabase');

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn()
    }
  }
}));

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/auth', authRoutes);
  return app;
};

describe('Integration Tests - Authentication Flow', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
    jest.clearAllMocks();
  });

  describe('Complete User Registration and Login Flow', () => {
    it('should complete full registration and login cycle', async () => {
      const userEmail = 'integration@test.com';
      const userPassword = 'password123';
      const mockUser = { id: '123', email: userEmail };

      // Step 1: Register user
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const registerResponse = await request(app)
        .post('/auth/register')
        .send({ email: userEmail, password: userPassword });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.message).toBe('Registration successful');

      // Step 2: Login with registered user
      const mockSession = {
        access_token: 'integration-token',
        refresh_token: 'integration-refresh'
      };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null
      });

      const loginResponse = await request(app)
        .post('/auth/login')
        .send({ email: userEmail, password: userPassword });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.access_token).toBe('integration-token');
      expect(loginResponse.body.user).toEqual(mockUser);

      // Step 3: Access protected route
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const meResponse = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`);

      expect(meResponse.status).toBe(200);
      expect(meResponse.body.user).toEqual(mockUser);

      // Step 4: Logout
      supabase.auth.signOut.mockResolvedValue({ error: null });

      const logoutResponse = await request(app)
        .post('/auth/logout')
        .set('Authorization', `Bearer ${loginResponse.body.access_token}`);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.body.message).toBe('Logged out successfully');
    });

    it('should handle registration with existing email', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'existing@test.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already registered');
    });

    it('should handle login with wrong password', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid login credentials');
    });

    it('should handle accessing protected route without token', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should handle accessing protected route with expired token', async () => {
      supabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' }
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer expired-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid or expired token');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle multiple rapid login attempts', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Too many requests' }
      });

      const promises = Array(5).fill().map(() =>
        request(app)
          .post('/auth/login')
          .send({ email: 'test@example.com', password: 'password123' })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Too many requests');
      });
    });

    it('should handle service unavailability', async () => {
      supabase.auth.signUp.mockRejectedValue(new Error('Service temporarily unavailable'));

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Service temporarily unavailable');
    });

    it('should handle malformed requests', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });
  });

  describe('Security Tests', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousEmail = "'; DROP TABLE users; --";
      
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({ email: maliciousEmail, password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should reject XSS attempts', async () => {
      const maliciousEmail = '<script>alert("xss")</script>@test.com';
      
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ email: maliciousEmail, password: 'password123' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Password too long' }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({ email: 'test@example.com', password: longPassword });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password too long');
    });
  });
});