import { apiService } from '../services/api';

// Mock fetch
global.fetch = jest.fn();

describe('API Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    apiService.clearToken();
  });

  describe('Authentication', () => {
    describe('register', () => {
      it('should register successfully', async () => {
        const mockResponse = {
          message: 'Registration successful',
          user: { id: '123', email: 'test@example.com' }
        };

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const result = await apiService.register('test@example.com', 'password123');

        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(
          'https://bolt-backend-fl0b.onrender.com/auth/register',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
          })
        );
      });

      it('should handle registration errors', async () => {
        const mockError = { error: 'Email already exists' };

        (fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockError)
        });

        await expect(apiService.register('test@example.com', 'password123'))
          .rejects.toThrow('Email already exists');
      });

      it('should handle network errors', async () => {
        (fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(apiService.register('test@example.com', 'password123'))
          .rejects.toThrow('Network error: Unable to connect to server');
      });
    });

    describe('login', () => {
      it('should login successfully', async () => {
        const mockResponse = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          user: { id: '123', email: 'test@example.com' }
        };

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const result = await apiService.login('test@example.com', 'password123');

        expect(result).toEqual(mockResponse);
        expect(apiService.getToken()).toBe('mock-token');
        expect(localStorage.getItem('auth_token')).toBe('mock-token');
      });

      it('should handle invalid credentials', async () => {
        const mockError = { error: 'Invalid login credentials' };

        (fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 400,
          json: () => Promise.resolve(mockError)
        });

        await expect(apiService.login('test@example.com', 'wrongpassword'))
          .rejects.toThrow('Invalid login credentials');
      });

      it('should handle 401 unauthorized', async () => {
        const mockError = { error: 'Unauthorized' };
        const mockCallback = jest.fn();
        apiService.setOnUnauthorizedCallback(mockCallback);

        (fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve(mockError)
        });

        await expect(apiService.login('test@example.com', 'password'))
          .rejects.toThrow('Unauthorized');

        expect(mockCallback).toHaveBeenCalled();
        expect(apiService.getToken()).toBeNull();
      });
    });

    describe('getCurrentUser', () => {
      it('should get current user with valid token', async () => {
        const mockUser = { user: { id: '123', email: 'test@example.com' } };
        apiService.setToken('valid-token');

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockUser)
        });

        const result = await apiService.getCurrentUser();

        expect(result).toEqual(mockUser);
        expect(fetch).toHaveBeenCalledWith(
          'https://bolt-backend-fl0b.onrender.com/auth/me',
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer valid-token'
            })
          })
        );
      });

      it('should handle expired token', async () => {
        const mockCallback = jest.fn();
        apiService.setToken('expired-token');
        apiService.setOnUnauthorizedCallback(mockCallback);

        (fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: 'Token expired' })
        });

        await expect(apiService.getCurrentUser())
          .rejects.toThrow('Token expired');

        expect(mockCallback).toHaveBeenCalled();
        expect(apiService.getToken()).toBeNull();
      });
    });

    describe('logout', () => {
      it('should logout successfully', async () => {
        const mockResponse = { message: 'Logged out successfully' };
        apiService.setToken('valid-token');

        (fetch as jest.Mock).mockResolvedValue({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        });

        const result = await apiService.logout();

        expect(result).toEqual(mockResponse);
        expect(fetch).toHaveBeenCalledWith(
          'https://bolt-backend-fl0b.onrender.com/auth/logout',
          expect.objectContaining({
            method: 'POST',
            headers: expect.objectContaining({
              'Authorization': 'Bearer valid-token'
            })
          })
        );
      });

      it('should handle logout errors', async () => {
        apiService.setToken('valid-token');

        (fetch as jest.Mock).mockResolvedValue({
          ok: false,
          status: 500,
          json: () => Promise.resolve({ error: 'Server error' })
        });

        await expect(apiService.logout())
          .rejects.toThrow('Server error');
      });
    });
  });

  describe('Token Management', () => {
    it('should set and get token', () => {
      apiService.setToken('test-token');
      expect(apiService.getToken()).toBe('test-token');
      expect(localStorage.getItem('auth_token')).toBe('test-token');
    });

    it('should clear token', () => {
      apiService.setToken('test-token');
      apiService.clearToken();
      expect(apiService.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });

    it('should retrieve token from localStorage', () => {
      localStorage.setItem('auth_token', 'stored-token');
      expect(apiService.getToken()).toBe('stored-token');
    });
  });

  describe('Error Handling', () => {
    it('should handle HTTP errors with custom messages', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: () => Promise.resolve({ error: 'Resource not found' })
      });

      await expect(apiService.getCurrentUser())
        .rejects.toThrow('Resource not found');
    });

    it('should handle HTTP errors without custom messages', async () => {
      (fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON'))
      });

      await expect(apiService.getCurrentUser())
        .rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('should handle network connectivity issues', async () => {
      (fetch as jest.Mock).mockRejectedValue(new TypeError('Failed to fetch'));

      await expect(apiService.getCurrentUser())
        .rejects.toThrow('Network error: Unable to connect to server');
    });
  });
});