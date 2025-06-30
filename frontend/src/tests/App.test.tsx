import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { apiService } from '../services/api';

// Mock the API service
jest.mock('../services/api', () => ({
  apiService: {
    getToken: jest.fn(),
    getCurrentUser: jest.fn(),
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    clearToken: jest.fn(),
    setOnUnauthorizedCallback: jest.fn()
  }
}));

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  },
  Toaster: () => <div data-testid="toaster" />
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>
  }
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication Flow', () => {
    it('should show login form when not authenticated', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue(null);

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      });
    });

    it('should show dashboard when authenticated', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (apiService.getToken as jest.Mock).mockReturnValue('valid-token');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Welcome to Your AI Podcast Studio')).toBeInTheDocument();
        expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument();
      });
    });

    it('should handle login success', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (apiService.getToken as jest.Mock).mockReturnValue(null);
      (apiService.login as jest.Mock).mockResolvedValue({
        access_token: 'token',
        user: mockUser
      });

      renderApp();

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByText('Sign In');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should handle login failure', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue(null);
      (apiService.login as jest.Mock).mockRejectedValue(new Error('Invalid credentials'));

      renderApp();

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByText('Sign In');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(apiService.login).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
      });
    });

    it('should handle registration success', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue(null);
      (apiService.register as jest.Mock).mockResolvedValue({
        message: 'Registration successful',
        user: { id: '123', email: 'test@example.com' }
      });

      renderApp();

      await waitFor(() => {
        const switchButton = screen.getByText("Don't have an account? Sign up");
        fireEvent.click(switchButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByText('Sign Up');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(apiService.register).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should validate form fields', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue(null);

      renderApp();

      await waitFor(() => {
        const submitButton = screen.getByText('Sign In');
        fireEvent.click(submitButton);
      });

      // Should not call API with empty fields
      expect(apiService.login).not.toHaveBeenCalled();
    });

    it('should validate password length for registration', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue(null);

      renderApp();

      await waitFor(() => {
        const switchButton = screen.getByText("Don't have an account? Sign up");
        fireEvent.click(switchButton);
      });

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByText('Sign Up');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: '123' } });
        fireEvent.click(submitButton);
      });

      // Should not call API with short password
      expect(apiService.register).not.toHaveBeenCalled();
    });

    it('should handle logout', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (apiService.getToken as jest.Mock).mockReturnValue('valid-token');
      (apiService.getCurrentUser as jest.Mock).mockResolvedValue({ user: mockUser });
      (apiService.logout as jest.Mock).mockResolvedValue({ message: 'Logged out' });

      renderApp();

      await waitFor(() => {
        const logoutButton = screen.getByText('Logout');
        fireEvent.click(logoutButton);
      });

      await waitFor(() => {
        expect(apiService.logout).toHaveBeenCalled();
        expect(apiService.clearToken).toHaveBeenCalled();
      });
    });

    it('should handle token validation failure', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue('invalid-token');
      (apiService.getCurrentUser as jest.Mock).mockRejectedValue(new Error('Token expired'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
        expect(apiService.clearToken).toHaveBeenCalled();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner during token validation', () => {
      (apiService.getToken as jest.Mock).mockReturnValue('valid-token');
      (apiService.getCurrentUser as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderApp();

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show loading state during form submission', async () => {
      (apiService.getToken as jest.Mock).mockReturnValue(null);
      (apiService.login as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      renderApp();

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('Enter your email');
        const passwordInput = screen.getByPlaceholderText('Enter your password');
        const submitButton = screen.getByText('Sign In');

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });
        fireEvent.click(submitButton);
      });

      expect(screen.getByText('Please wait...')).toBeInTheDocument();
    });
  });
});