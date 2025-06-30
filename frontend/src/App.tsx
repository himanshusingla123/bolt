import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mic, Volume2, FileAudio, Users, Settings, LogOut, Menu, X } from 'lucide-react';
import { apiService } from './services/api';
import { TextToSpeech } from './components/TextToSpeech';
import { SpeechToText } from './components/SpeechToText';
import { AudioDubbing } from './components/AudioDubbing';
import { AIConversation } from './components/AIConversation';
import toast from 'react-hot-toast';

// Components
const Header = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white">AI Podcast Platform</h1>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-white/80">Welcome, {user?.email}</span>
            <button
              onClick={onLogout}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-white rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white p-2"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20">
            <div className="flex flex-col space-y-2">
              <span className="text-white/80 px-4">Welcome, {user?.email}</span>
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg mx-4"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

const FeatureCard = ({ icon: Icon, title, description, onClick, isActive }: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
  isActive: boolean;
}) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`rounded-xl p-6 border cursor-pointer transition-all duration-300 ${
      isActive
        ? 'bg-purple-500/20 border-purple-400'
        : 'bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15'
    }`}
    onClick={onClick}
  >
    <div className="flex items-center space-x-4 mb-4">
      <div className={`p-3 rounded-lg ${
        isActive ? 'bg-purple-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
      }`}>
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-xl font-semibold text-white">{title}</h3>
    </div>
    <p className="text-white/70">{description}</p>
  </motion.div>
);

const Dashboard = ({ user, onLogout }: { user: any; onLogout: () => void }) => {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features = [
    {
      icon: Mic,
      title: "Speech to Text",
      description: "Convert audio recordings to accurate text transcriptions",
      id: "stt"
    },
    {
      icon: Volume2,
      title: "Text to Speech",
      description: "Generate natural-sounding speech from text",
      id: "tts"
    },
    {
      icon: FileAudio,
      title: "Audio Dubbing",
      description: "Translate and dub audio content in multiple languages",
      id: "dubbing"
    },
    {
      icon: Users,
      title: "AI Conversations",
      description: "Engage in natural conversations with AI agents",
      id: "conversation"
    }
  ];

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'stt':
        return <SpeechToText />;
      case 'tts':
        return <TextToSpeech />;
      case 'dubbing':
        return <AudioDubbing />;
      case 'conversation':
        return <AIConversation />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Header user={user} onLogout={onLogout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-4"
          >
            Welcome to Your AI Podcast Studio
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/70 max-w-2xl mx-auto"
          >
            Create, transcribe, and enhance your audio content with cutting-edge AI technology
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                onClick={() => setActiveFeature(activeFeature === feature.id ? null : feature.id)}
                isActive={activeFeature === feature.id}
              />
            </motion.div>
          ))}
        </div>

        {activeFeature && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">
                {features.find(f => f.id === activeFeature)?.title}
              </h3>
              <button
                onClick={() => setActiveFeature(null)}
                className="text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
            </div>
            
            {renderActiveFeature()}
          </motion.div>
        )}
      </main>

      {/* Bolt Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://bolt.new/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-12 h-12 hover:scale-110 transition-transform duration-200"
        >
          <img
            src="https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/3f09b71855feb7d3c02ed170ccae764b842cf4ce/src/public/bolt-badge/white_circle_360x360/white_circle_360x360.svg"
            alt="Built with Bolt"
            className="w-full h-full"
          />
        </a>
      </div>
    </div>
  );
};

const AuthForm = ({ onLogin }: { onLogin: (user: any) => void }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isLogin) {
        const response = await apiService.login(email, password);
        onLogin(response.user);
        toast.success('Login successful!');
      } else {
        await apiService.register(email, password);
        toast.success('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-md rounded-xl p-8 border border-white/20 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">AI Podcast Platform</h1>
          <p className="text-white/70">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-white/70 hover:text-white transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>

      {/* Bolt Badge */}
      <div className="fixed bottom-4 right-4 z-50">
        <a
          href="https://bolt.new/"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-12 h-12 hover:scale-110 transition-transform duration-200"
        >
          <img
            src="https://raw.githubusercontent.com/kickiniteasy/bolt-hackathon-badge/3f09b71855feb7d3c02ed170ccae764b842cf4ce/src/public/bolt-badge/white_circle_360x360/white_circle_360x360.svg"
            alt="Built with Bolt"
            className="w-full h-full"
          />
        </a>
      </div>
    </div>
  );
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateToken = async () => {
      const token = apiService.getToken();
      if (token) {
        try {
          const response = await apiService.getCurrentUser();
          setUser(response.user);
        } catch (error) {
          // Token is invalid, clear it
          apiService.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    validateToken();
  }, []);

  const handleLogin = (userData: any) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiService.clearToken();
    setUser(null);
    toast.success('Logged out successfully');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route
            path="/"
            element={
              user ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <AuthForm onLogin={handleLogin} />
              )
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;