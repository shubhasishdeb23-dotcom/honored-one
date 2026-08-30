import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, X, Plus, Trash2, Play, ArrowRight, Check, AlertCircle, ExternalLink } from 'lucide-react';
import type { ScanResult } from '../../context/LabelGuardContext';

interface BatchScannerProps {
  onProcess: (files: File[]) => Promise<ScanResult[]>;
  onOpenResult: (result: ScanResult) => void;
  onClose: () => void;
}

export interface BatchResult {
  id: string;
  fileName: string;
  status: 'pending' | 'scanning' | 'completed' | 'error';
  score?: number;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  result?: ScanResult;
  error?: string;
}

export const BatchScanner = ({ onProcess, onOpenResult, onClose }: BatchScannerProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<BatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processBatch = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    const batchResults: BatchResult[] = files.map((f, i) => ({
      id: `batch-${i}`,
      fileName: f.name,
      status: 'pending' as const,
    }));
    setResults(batchResults);

    try {
      const real = await onProcess(files);
      const completed: BatchResult[] = batchResults.map((r, i) => {
        const scan = real[i];
        if (!scan) return { ...r, status: 'error' as const, error: 'No result returned' };
        return {
          ...r,
          status: 'completed' as const,
          score: scan.compliance?.score,
          riskLevel: scan.compliance?.risk_level,
          result: scan,
        };
      });
      setResults(completed);
    } catch {
      setResults(batchResults.map((r) => ({
        ...r,
        status: 'error' as const,
        error: 'Batch scan failed. Check that the backend is running.',
      })));
    }

    setIsProcessing(false);
    setCurrentIndex(-1);
  };

  const getRiskColor = (level?: 'LOW' | 'MEDIUM' | 'HIGH') => {
    switch (level) {
      case 'LOW': return 'text-emerald-400 bg-emerald-500/10';
      case 'MEDIUM': return 'text-amber-400 bg-amber-500/10';
      case 'HIGH': return 'text-red-400 bg-red-500/10';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  const completedCount = results.filter(r => r.status === 'completed').length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">Batch Scanner</h2>
            <p className="text-gray-400 text-sm">Scan multiple products at once</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pt-24 pb-32">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-colors mb-6"
        >
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            id="batch-file-input"
          />
          <label htmlFor="batch-file-input" className="cursor-pointer">
            <Plus className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">Drag & drop images or click to add</p>
            <p className="text-gray-600 text-sm mt-2">Supports JPG, PNG, WebP</p>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-400 text-sm">{files.length} images queued</span>
              {!isProcessing && (
                <button
                  onClick={() => { setFiles([]); setResults([]); }}
                  className="text-gray-500 text-sm hover:text-red-400 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            <AnimatePresence>
              {files.map((file, index) => {
                const r = results[index];
                return (
                  <motion.div
                    key={`${file.name}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/5"
                  >
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm truncate">{file.name}</p>
                      <p className="text-gray-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
                      {r?.result?.product?.product_name && (
                        <p className="text-teal-400 text-xs truncate mt-0.5">
                          {r.result.product.product_name}
                        </p>
                      )}
                    </div>

                    {r?.status === 'completed' && r.result && (
                      <>
                        <span className="text-2xl font-bold text-white">{r.score}</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(r.riskLevel)}`}>
                          {r.riskLevel}
                        </span>
                        <button
                          onClick={() => onOpenResult(r.result!)}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-white/5 text-teal-300 text-xs hover:bg-teal-500/20 transition-colors"
                        >
                          <ExternalLink size={14} />
                          View
                        </button>
                      </>
                    )}
                    {r?.status === 'scanning' && (
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                    )}
                    {r?.status === 'error' && (
                      <span className="flex items-center gap-1 text-red-400 text-xs">
                        <AlertCircle size={14} />
                        {r.error}
                      </span>
                    )}

                    {!isProcessing && r?.status !== 'completed' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {isProcessing && (
              <div className="fixed bottom-24 left-4 right-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-purple-400 text-sm font-medium">Running real OCR + compliance...</span>
                  <span className="text-white text-sm">{results.filter(r => r.status === 'completed').length} / {files.length} done</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedCount / files.length) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent">
        <button
          onClick={processBatch}
          disabled={files.length === 0 || isProcessing}
          className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50 hover:from-purple-400 hover:to-pink-400 transition-all"
        >
          {isProcessing ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing...
            </>
          ) : completedCount > 0 ? (
            <>
              <Check size={20} />
              Rescan Batch
              <ArrowRight size={20} />
            </>
          ) : (
            <>
              <Play size={20} />
              Start Batch Scan
              <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};
