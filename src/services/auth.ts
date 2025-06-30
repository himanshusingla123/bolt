const API_BASE_URL = 'https://bolt-backend-fl0b.onrender.com';

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  user: User;
}

export interface RegisterData {
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

class AuthService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(error.error || 'Registration failed');
    }

    const result = await response.json();
    
    // Handle different response formats from Supabase
    if (result.session) {
      return {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
        user: result.user,
      };
    }

    return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Invalid credentials');
    }

    const result = await response.json();
    
    // Handle different response formats from Supabase
    if (result.session) {
      return {
        access_token: result.session.access_token,
        refresh_token: result.session.refresh_token,
        user: result.user,
      };
    }

    return result;
  }

  async logout(): Promise<void> {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();