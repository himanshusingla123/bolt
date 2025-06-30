const API_BASE_URL = 'https://bolt-backend-fl0b.onrender.com';

class ApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async handleResponse(response: Response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    return response.json();
  }

  // TTS Endpoints
  async getVoices() {
    const response = await fetch(`${this.baseURL}/tts/voices`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async textToSpeech(text: string, voiceId: string) {
    const response = await fetch(`${this.baseURL}/tts/text-to-speech`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        text,
        voice_id: voiceId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate speech');
    }

    return response.blob();
  }

  // STT Endpoints
  async transcribeAudio(audioFile: File, languageCode?: string) {
    const formData = new FormData();
    formData.append('file', audioFile);
    if (languageCode) {
      formData.append('language_code', languageCode);
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/stt/transcribe`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  // Dubbing Endpoints
  async createDubbing(targetLang: string, files: File[], sourceLang = 'auto') {
    const formData = new FormData();
    formData.append('target_lang', targetLang);
    formData.append('source_lang', sourceLang);
    
    files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });

    const headers: HeadersInit = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseURL}/dubbing/create`, {
      method: 'POST',
      headers,
      body: formData,
    });

    return this.handleResponse(response);
  }

  async getDubbingStatus(dubbingId: string) {
    const response = await fetch(`${this.baseURL}/dubbing/${dubbingId}`, {
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  async deleteDubbing(dubbingId: string) {
    const response = await fetch(`${this.baseURL}/dubbing/${dubbingId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(response);
  }

  // Health Check
  async healthCheck() {
    const response = await fetch(`${this.baseURL}/health`);
    return response.ok;
  }
}

export const apiService = new ApiService();