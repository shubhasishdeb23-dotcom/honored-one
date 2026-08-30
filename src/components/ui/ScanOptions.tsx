import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Camera, QrCode, Image, Video, X } from 'lucide-react';

interface ScanOptionsProps {
  onSelect: (type: string) => void;
  onClose: () => void;
}

export const ScanOptions = ({ onSelect, onClose }: ScanOptionsProps) => {
  const options = [
    { id: 'upload', label: 'Upload Image', icon: Upload, description: 'Upload from device', color: 'from-teal-500 to-cyan-500' },
    { id: 'camera', label: 'Take Photo', icon: Camera, description: 'Use camera', color: 'from-cyan-500 to-blue-500' },
    { id: 'qr', label: 'Scan QR Code', icon: QrCode, description: 'Scan product QR', color: 'from-blue-500 to-indigo-500' },
    { id: 'gallery', label: 'Gallery', icon: Image, description: 'Recent photos', color: 'from-indigo-500 to-purple-500' },
    { id: 'video', label: 'Video Scan', icon: Video, description: 'Scan from video', color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#0a0a0a] rounded-3xl border border-white/10 p-6"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-2">Choose Scan Method</h2>
        <p className="text-gray-400 text-sm mb-6">Select how you want to scan the product label</p>

        <div className="grid grid-cols-2 gap-3">
          {options.map((option) => (
            <motion.button
              key={option.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(option.id)}
              className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <option.icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <span className="text-white font-medium block">{option.label}</span>
                <span className="text-gray-500 text-xs">{option.description}</span>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
