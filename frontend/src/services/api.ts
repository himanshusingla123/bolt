const API_BASE_URL = 'https://bolt-backend-fl0b.onrender.com';

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
  };
}

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  language: string;
}

interface DubbingResponse {
  dubbing_id: string;
  status: string;
  estimated_time_remaining?: number;
  audio_url?: string;
}

interface TranscriptionResponse {
  text: string;
  language: string;
  duration: number;
}

interface ApiError extends Error {
  status?: number;
}

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken() {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Only add Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      const apiError = new Error(error.error || 'Request failed') as ApiError;
      apiError.status = response.status;
      throw apiError;
    }

    return response;
  }

  // Auth endpoints
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.json();
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser(): Promise<{ user: { id: string; email: string } }> {
    const response = await this.request('/auth/me');
    return response.json();
  }

  // TTS endpoints
  async getVoices(): Promise<Voice[]> {
    const response = await this.request('/tts/voices');
    console.log("response");
    return response.json();
  }

  async textToSpeech(text: string, voiceId: string): Promise<Blob> {
    const response = await this.request('/tts/text-to-speech', {
      method: 'POST',
      body: JSON.stringify({ text, voice_id: voiceId }),
    });
    return response.blob();
  }

  // STT endpoints
  async transcribeAudio(audioFile: File): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await this.request('/stt/transcribe', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  // Dubbing endpoints
  async createDubbing(files: FileList, targetLang: string, sourceLang = 'auto'): Promise<DubbingResponse> {
    const formData = new FormData();
    formData.append('target_lang', targetLang);
    formData.append('source_lang', sourceLang);
    
    Array.from(files).forEach((file, index) => {
      formData.append(`files[${index}]`, file);
    });

    const response = await this.request('/dubbing/create', {
      method: 'POST',
      body: formData,
    });
    return response.json();
  }

  async getDubbingStatus(dubbingId: string): Promise<DubbingResponse> {
    const response = await this.request(`/dubbing/${dubbingId}`);
    return response.json();
  }

  async deleteDubbing(dubbingId: string): Promise<{ message: string }> {
    const response = await this.request(`/dubbing/${dubbingId}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const apiService = new ApiService();