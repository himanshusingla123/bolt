const { verifyToken } = require('../middleware/auth');
const { supabase } = require('../config/supabase');

// Mock Supabase
jest.mock('../config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    }
  }
}));

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should pass with valid token', async () => {
    const mockUser = { id: '123', email: 'test@example.com' };
    req.headers.authorization = 'Bearer valid-token';
    
    supabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null
    });

    await verifyToken(req, res, next);

    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should fail with no authorization header', async () => {
    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail with invalid authorization format', async () => {
    req.headers.authorization = 'InvalidFormat token';

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail with empty token', async () => {
    req.headers.authorization = 'Bearer ';

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail with expired token', async () => {
    req.headers.authorization = 'Bearer expired-token';
    
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'JWT expired' }
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail with invalid token', async () => {
    req.headers.authorization = 'Bearer invalid-token';
    
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid JWT' }
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    req.headers.authorization = 'Bearer valid-token';
    
    supabase.auth.getUser.mockRejectedValue(new Error('Service unavailable'));

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication failed' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should fail when user is null', async () => {
    req.headers.authorization = 'Bearer valid-token';
    
    supabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null
    });

    await verifyToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    expect(next).not.toHaveBeenCalled();
  });
});