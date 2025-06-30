import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Wifi, WifiOff } from 'lucide-react';
import { apiService } from '../services/api';

export const ConnectionStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const healthy = await apiService.healthCheck();
      setIsConnected(healthy);
    } catch (error) {
      setIsConnected(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (isConnected === null) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-4 right-4 z-50 px-3 py-2 rounded-lg backdrop-blur-md border ${
        isConnected
          ? 'bg-green-500/20 border-green-500/30 text-green-400'
          : 'bg-red-500/20 border-red-500/30 text-red-400'
      }`}
    >
      <div className="flex items-center gap-2 text-sm">
        {isChecking ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : isConnected ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
        <span>
          {isChecking ? 'Checking...' : isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </motion.div>
  );
};