import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Volume2, Play, Pause, Download, Loader } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface Voice {
  voice_id: string;
  name: string;
  gender: string;
  language: string;
}

export const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const voicesData = await apiService.getVoices();
      setVoices(voicesData);
      if (voicesData.length > 0) {
        setSelectedVoice(voicesData[0].voice_id);
      }
    } catch (error) {
      toast.error('Failed to load voices');
      console.error('Error loading voices:', error);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim() || !selectedVoice) {
      toast.error('Please enter text and select a voice');
      return;
    }

    setLoading(true);
    try {
      const audioBlob = await apiService.textToSpeech(text, selectedVoice);
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      
      const audio = new Audio(url);
      setAudioElement(audio);
      
      audio.onended = () => setIsPlaying(false);
      
      toast.success('Speech generated successfully!');
    } catch (error) {
      toast.error('Failed to generate speech');
      console.error('Error generating speech:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlayback = () => {
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
    } else {
      audioElement.play();
      setIsPlaying(true);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;

    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = 'generated-speech.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Volume2 className="text-purple-400" size={24} />
        <h3 className="text-xl font-semibold text-white">Text to Speech</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Select Voice
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {voices.map((voice) => (
              <option key={voice.voice_id} value={voice.voice_id} className="bg-gray-800">
                {voice.name} ({voice.gender}, {voice.language})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Text to Convert
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter the text you want to convert to speech..."
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            rows={4}
          />
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateSpeech}
          disabled={loading || !text.trim() || !selectedVoice}
          className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Volume2 size={20} />
              <span>Generate Speech</span>
            </>
          )}
        </motion.button>

        {audioUrl && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 rounded-lg p-4 space-y-4"
          >
            <h4 className="text-white font-medium">Generated Audio</h4>
            <div className="flex space-x-3">
              <button
                onClick={togglePlayback}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={downloadAudio}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
              >
                <Download size={16} />
                <span>Download</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};