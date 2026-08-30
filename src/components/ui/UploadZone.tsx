import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Image, Check, X, Plus } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export const UploadZone = ({ onFilesSelected, maxFiles = 3 }: UploadZoneProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith('image/')
    );
    
    const newFiles = [...files, ...droppedFiles].slice(0, maxFiles);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  }, [files, maxFiles, onFilesSelected]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).slice(0, maxFiles);
      setFiles(selectedFiles);
      onFilesSelected(selectedFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 transition-all duration-300 ${
          isDragging
            ? 'border-teal-500 bg-teal-500/5'
            : files.length > 0
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-white/10 hover:border-white/20 bg-white/[0.02]'
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />

        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            animate={{
              scale: isDragging ? 1.1 : 1,
              y: isDragging ? -5 : 0,
            }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
              files.length > 0
                ? 'bg-emerald-500/10'
                : 'bg-white/5'
            }`}
          >
            {files.length > 0 ? (
              <Check className="w-8 h-8 text-emerald-500" />
            ) : (
              <Upload className={`w-8 h-8 ${isDragging ? 'text-teal-500' : 'text-gray-400'}`} />
            )}
          </motion.div>

          <h3 className="text-lg font-medium text-white mb-2">
            {files.length > 0
              ? `${files.length} image${files.length > 1 ? 's' : ''} selected`
              : 'Drop product label images here'}
          </h3>
          <p className="text-gray-500 text-sm">
            {files.length > 0
              ? 'Click to add more or replace'
              : `or click to browse (max ${maxFiles} images)`}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {files.map((file, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-xl overflow-hidden border border-white/10"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-xs text-white truncate">{file.name}</p>
                </div>
              </motion.div>
            ))}
            
            {files.length < maxFiles && (
              <label className="flex flex-col items-center justify-center h-32 rounded-xl border border-dashed border-white/10 hover:border-white/20 cursor-pointer transition-colors">
                <Plus className="w-6 h-6 text-gray-500" />
                <span className="text-xs text-gray-500 mt-1">Add more</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const newFiles = [...files, e.target.files[0]].slice(0, maxFiles);
                      setFiles(newFiles);
                      onFilesSelected(newFiles);
                    }
                  }}
                />
              </label>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
