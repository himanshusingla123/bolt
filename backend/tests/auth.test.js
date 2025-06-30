const request = require('supertest');
const express = require('express');
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

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);

describe('Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a user successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Registration successful');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should fail with short password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 6 characters long');
    });

    it('should fail with invalid email format', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Invalid email format' }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
    });

    it('should fail with existing email', async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'User already registered' }
      });

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User already registered');
    });

    it('should handle Supabase service errors', async () => {
      supabase.auth.signUp.mockRejectedValue(new Error('Service unavailable'));

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Service unavailable');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token'
      };
      const mockUser = { id: '123', email: 'test@example.com' };

      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession, user: mockUser },
        error: null
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.access_token).toBe('mock-access-token');
      expect(response.body.refresh_token).toBe('mock-refresh-token');
      expect(response.body.user).toEqual(mockUser);
    });

    it('should fail with missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should fail with missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should fail with invalid credentials', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid login credentials');
    });

    it('should fail with unregistered email', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('User not found');
    });

    it('should handle rate limiting', async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Too many requests' }
      });

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Too many requests');
    });
  });

  describe('GET /auth/me', () => {
    it('should return user info with valid token', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });

      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual(mockUser);
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should fail with invalid token format', async () => {
      const response = await request(app)
        .get('/auth/me')
        .set('Authorization', 'invalid-format');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should fail with expired token', async () => {
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

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      supabase.auth.signOut.mockResolvedValue({
        error: null
      });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('No token provided');
    });

    it('should handle logout service errors', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      supabase.auth.signOut.mockResolvedValue({
        error: { message: 'Logout failed' }
      });

      const response = await request(app)
        .post('/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Logout failed');
    });
  });
});