import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileAudio, Upload, Loader, Download, Trash2, RefreshCw } from 'lucide-react';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';

interface DubbingProject {
  dubbing_id: string;
  status: string;
  estimated_time_remaining?: number;
  audio_url?: string;
}

export const AudioDubbing: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [targetLang, setTargetLang] = useState('es');
  const [sourceLang, setSourceLang] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [dubbingProject, setDubbingProject] = useState<DubbingProject | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'auto', name: 'Auto-detect' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh', name: 'Chinese' },
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles(selectedFiles);
      toast.success(`${selectedFiles.length} file(s) selected`);
    }
  };

  const createDubbing = async () => {
    if (!files || files.length === 0) {
      toast.error('Please select audio/video files');
      return;
    }

    if (targetLang === 'auto') {
      toast.error('Please select a target language');
      return;
    }

    setLoading(true);
    try {
      const result = await apiService.createDubbing(files, targetLang, sourceLang);
      setDubbingProject(result);
      toast.success('Dubbing project created! Processing...');
      
      // Start checking status
      checkStatus(result.dubbing_id);
    } catch (error) {
      toast.error('Failed to create dubbing project');
      console.error('Error creating dubbing:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async (dubbingId?: string) => {
    const id = dubbingId || dubbingProject?.dubbing_id;
    if (!id) return;

    setCheckingStatus(true);
    try {
      const status = await apiService.getDubbingStatus(id);
      setDubbingProject(status);
      
      if (status.status === 'processing') {
        // Check again in 5 seconds
        setTimeout(() => checkStatus(id), 5000);
      } else if (status.status === 'completed') {
        toast.success('Dubbing completed!');
      } else if (status.status === 'failed') {
        toast.error('Dubbing failed');
      }
    } catch (error) {
      toast.error('Failed to check dubbing status');
      console.error('Error checking status:', error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const deleteDubbing = async () => {
    if (!dubbingProject?.dubbing_id) return;

    try {
      await apiService.deleteDubbing(dubbingProject.dubbing_id);
      setDubbingProject(null);
      toast.success('Dubbing project deleted');
    } catch (error) {
      toast.error('Failed to delete dubbing project');
      console.error('Error deleting dubbing:', error);
    }
  };

  const downloadDubbing = () => {
    if (!dubbingProject?.audio_url) return;

    const a = document.createElement('a');
    a.href = dubbingProject.audio_url;
    a.download = 'dubbed-audio.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileAudio className="text-purple-400" size={24} />
        <h3 className="text-xl font-semibold text-white">Audio Dubbing</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Source Language
          </label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-gray-800">
                {lang.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Target Language
          </label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {languages.filter(lang => lang.code !== 'auto').map((lang) => (
              <option key={lang.code} value={lang.code} className="bg-gray-800">
                {lang.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => fileInputRef.current?.click()}
        className="w-full p-8 rounded-lg border-2 border-dashed border-white/20 bg-white/5 text-white hover:border-purple-400 hover:bg-purple-500/10 transition-all duration-200"
      >
        <div className="flex flex-col items-center space-y-3">
          <Upload size={48} />
          <span className="text-lg font-medium">Upload Audio/Video Files</span>
          <span className="text-white/60">MP3, WAV, MP4, MOV supported</span>
        </div>
      </motion.button>

      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {files && files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-4 space-y-2"
        >
          <h4 className="text-white font-medium">Selected Files:</h4>
          {Array.from(files).map((file, index) => (
            <div key={index} className="flex items-center space-x-3">
              <FileAudio className="text-blue-400" size={16} />
              <span className="text-white">{file.name}</span>
              <span className="text-white/60 text-sm">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
          ))}
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={createDubbing}
        disabled={loading || !files || files.length === 0}
        className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Creating Dubbing...</span>
          </>
        ) : (
          <>
            <FileAudio size={20} />
            <span>Start Dubbing</span>
          </>
        )}
      </motion.button>

      {dubbingProject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-white font-medium">Dubbing Project</h4>
            <div className="flex space-x-2">
              <button
                onClick={() => checkStatus()}
                disabled={checkingStatus}
                className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50"
              >
                <RefreshCw size={16} className={checkingStatus ? 'animate-spin' : ''} />
                <span>Refresh</span>
              </button>
              <button
                onClick={deleteDubbing}
                className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Trash2 size={16} />
                <span>Delete</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-white/70">Status:</span>
              <span className={`font-medium ${
                dubbingProject.status === 'completed' ? 'text-green-400' :
                dubbingProject.status === 'processing' ? 'text-yellow-400' :
                dubbingProject.status === 'failed' ? 'text-red-400' : 'text-white'
              }`}>
                {dubbingProject.status.charAt(0).toUpperCase() + dubbingProject.status.slice(1)}
              </span>
            </div>
            
            {dubbingProject.estimated_time_remaining && (
              <div className="flex justify-between">
                <span className="text-white/70">Estimated time:</span>
                <span className="text-white">{dubbingProject.estimated_time_remaining}s</span>
              </div>
            )}
          </div>

          {dubbingProject.status === 'completed' && dubbingProject.audio_url && (
            <button
              onClick={downloadDubbing}
              className="w-full py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors flex items-center justify-center space-x-2"
            >
              <Download size={16} />
              <span>Download Dubbed Audio</span>
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};