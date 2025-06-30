import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService } from '../services/api';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  result?: any;
  error?: string;
}

export const UploadZone: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activeTab, setActiveTab] = useState<'audio' | 'dubbing'>('audio');

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      addFiles(selectedFiles);
    }
  }, []);

  const addFiles = (newFiles: File[]) => {
    const uploadFiles: UploadedFile[] = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      status: 'pending',
      progress: 0,
    }));

    setFiles(prev => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const processAudioFile = async (uploadFile: UploadedFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'processing', progress: 50 }
          : f
      ));

      const result = await apiService.transcribeAudio(uploadFile.file);
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100, result }
          : f
      ));

      toast.success(`Transcription completed for ${uploadFile.file.name}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      toast.error(`Failed to process ${uploadFile.file.name}: ${errorMessage}`);
    }
  };

  const processDubbingFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    if (pendingFiles.length === 0) {
      toast.error('No files to process');
      return;
    }

    try {
      setFiles(prev => prev.map(f => 
        f.status === 'pending' 
          ? { ...f, status: 'processing', progress: 30 }
          : f
      ));

      const fileList = pendingFiles.map(f => f.file);
      const result = await apiService.createDubbing('en', fileList);
      
      setFiles(prev => prev.map(f => 
        pendingFiles.some(pf => pf.id === f.id)
          ? { ...f, status: 'completed', progress: 100, result }
          : f
      ));

      toast.success('Dubbing project created successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Dubbing failed';
      
      setFiles(prev => prev.map(f => 
        pendingFiles.some(pf => pf.id === f.id)
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));

      toast.error(`Dubbing failed: ${errorMessage}`);
    }
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'processing':
      case 'uploading':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent">
            Upload Zone
          </h1>
          <p className="text-gray-400 mt-2">
            Upload audio files for transcription or dubbing
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-white/5 backdrop-blur-sm rounded-lg p-1">
        {[
          { id: 'audio', label: 'Audio Transcription' },
          { id: 'dubbing', label: 'Video Dubbing' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'audio' | 'dubbing')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <motion.div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          isDragging
            ? 'border-purple-400 bg-purple-500/10'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <input
          type="file"
          multiple
          accept={activeTab === 'audio' ? 'audio/*' : 'video/*,audio/*'}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          Drop your {activeTab === 'audio' ? 'audio' : 'video/audio'} files here
        </h3>
        <p className="text-gray-400 mb-4">
          or click to browse from your computer
        </p>
        <div className="text-sm text-gray-500">
          Supported formats: {activeTab === 'audio' ? 'MP3, WAV, M4A, FLAC' : 'MP4, AVI, MOV, MP3, WAV'}
        </div>
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              Uploaded Files ({files.length})
            </h3>
            {activeTab === 'dubbing' && files.some(f => f.status === 'pending') && (
              <button
                onClick={processDubbingFiles}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Start Dubbing
              </button>
            )}
          </div>

          <div className="space-y-3">
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(file.status)}
                    <div>
                      <p className="text-white font-medium">{file.file.name}</p>
                      <p className="text-gray-400 text-sm">
                        {formatFileSize(file.file.size)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {file.status === 'pending' && activeTab === 'audio' && (
                      <button
                        onClick={() => processAudioFile(file)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                      >
                        Transcribe
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                {(file.status === 'uploading' || file.status === 'processing') && (
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results */}
                {file.result && (
                  <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    {activeTab === 'audio' && file.result.text && (
                      <div>
                        <p className="text-green-400 text-sm font-medium mb-1">Transcription:</p>
                        <p className="text-white text-sm">{file.result.text}</p>
                      </div>
                    )}
                    {activeTab === 'dubbing' && (
                      <div>
                        <p className="text-green-400 text-sm font-medium mb-1">Dubbing ID:</p>
                        <p className="text-white text-sm font-mono">{file.result.dubbing_id}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Error */}
                {file.error && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{file.error}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};