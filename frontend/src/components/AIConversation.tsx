import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import toast from 'react-hot-toast';

export const AIConversation: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: 'user' | 'agent'; text: string; timestamp: Date }>>([]);

  const startConversation = async () => {
    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setIsConnected(true);
      toast.success('Connected to AI agent');
      
      // Add welcome message
      setMessages([{
        type: 'agent',
        text: 'Hello! I\'m your AI assistant. How can I help you today?',
        timestamp: new Date()
      }]);
    } catch (error) {
      toast.error('Failed to connect to AI agent');
      console.error('Error starting conversation:', error);
    }
  };

  const endConversation = () => {
    setIsConnected(false);
    setIsMuted(false);
    toast.success('Conversation ended');
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Microphone unmuted' : 'Microphone muted');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Users className="text-purple-400" size={24} />
        <h3 className="text-xl font-semibold text-white">AI Conversation</h3>
      </div>

      <div className="bg-white/5 rounded-lg p-6 space-y-4">
        <div className="text-center">
          <h4 className="text-white font-medium mb-2">Voice Conversation with AI Agent</h4>
          <p className="text-white/70 text-sm">
            Start a real-time voice conversation with an AI agent powered by ElevenLabs
          </p>
        </div>

        <div className="flex justify-center space-x-4">
          {!isConnected ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startConversation}
              className="flex items-center space-x-2 px-6 py-3 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <Phone size={20} />
              <span>Start Conversation</span>
            </motion.button>
          ) : (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMute}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-colors ${
                  isMuted
                    ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
                }`}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                <span>{isMuted ? 'Unmute' : 'Mute'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={endConversation}
                className="flex items-center space-x-2 px-6 py-3 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <PhoneOff size={20} />
                <span>End Conversation</span>
              </motion.button>
            </>
          )}
        </div>

        {isConnected && (
          <div className="mt-6">
            <div className="bg-white/5 rounded-lg p-4 h-64 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-white/50 mt-20">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Conversation will appear here...</p>
                </div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-purple-500/20 text-purple-100'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="text-sm">{message.text}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {isConnected && (
              <div className="mt-4 text-center">
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">Connected to AI Agent</span>
                </div>
                <p className="text-white/50 text-xs mt-1">
                  Speak naturally - the AI will respond in real-time
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white/5 rounded-lg p-4">
        <h5 className="text-white font-medium mb-2">Note:</h5>
        <p className="text-white/70 text-sm">
          This feature requires backend integration with ElevenLabs Conversational AI API and WebSocket connections. 
          The current implementation shows the UI structure and basic connection flow.
        </p>
      </div>
    </div>
  );
};