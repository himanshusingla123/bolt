import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Upload, FileAudio, Loader, Copy, Check } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

export const SpeechToText: React.FC = () => {
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });
        setAudioFile(audioFile);
        setRecordedChunks(chunks);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success('Recording started');
    } catch (error) {
      toast.error('Failed to start recording');
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      toast.success('Recording stopped');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAudioFile(file);
      toast.success('Audio file selected');
    }
  };

  const transcribeAudio = async () => {
    if (!audioFile) {
      toast.error('Please select or record an audio file');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.transcribeAudio(audioFile);
      setTranscription(result.text);
      toast.success('Transcription completed!');
    } catch (error) {
      toast.error('Failed to transcribe audio');
      console.error('Error transcribing audio:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!transcription) return;
    
    try {
      await navigator.clipboard.writeText(transcription);
      setCopied(true);
      toast.success('Transcription copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <Mic className="text-purple-400" size={24} />
        <h3 className="text-xl font-semibold text-white">Speech to Text</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={isRecording ? stopRecording : startRecording}
          className={`p-6 rounded-lg border-2 border-dashed transition-all duration-200 ${
            isRecording
              ? 'border-red-400 bg-red-500/10 text-red-400'
              : 'border-white/20 bg-white/5 text-white hover:border-purple-400 hover:bg-purple-500/10'
          }`}
        >
          <div className="flex flex-col items-center space-y-3">
            <Mic size={32} className={isRecording ? 'animate-pulse' : ''} />
            <span className="font-medium">
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </span>
            {isRecording && (
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-sm">Recording...</span>
              </div>
            )}
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => fileInputRef.current?.click()}
          className="p-6 rounded-lg border-2 border-dashed border-white/20 bg-white/5 text-white hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-200"
        >
          <div className="flex flex-col items-center space-y-3">
            <Upload size={32} />
            <span className="font-medium">Upload Audio File</span>
            <span className="text-sm text-white/60">MP3, WAV, M4A supported</span>
          </div>
        </motion.button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {audioFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <FileAudio className="text-blue-400" size={20} />
            <span className="text-white">{audioFile.name}</span>
            <span className="text-white/60 text-sm">
              ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
            </span>
          </div>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={transcribeAudio}
        disabled={loading || !audioFile}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Transcribing...</span>
          </>
        ) : (
          <>
            <Mic size={20} />
            <span>Transcribe Audio</span>
          </>
        )}
      </motion.button>

      {transcription && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">Transcription Result</h4>
            <button
              onClick={copyToClipboard}
              className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <p className="text-white leading-relaxed">{transcription}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};