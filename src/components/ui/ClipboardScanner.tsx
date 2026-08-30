import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clipboard, X, Check, AlertCircle, Loader2 } from 'lucide-react';

interface ClipboardScannerProps {
  onCapture: (file: File) => void;
  onText: (text: string) => void;
  onClose: () => void;
}

export const ClipboardScanner = ({ onCapture, onText, onClose }: ClipboardScannerProps) => {
  const [clipboardData, setClipboardData] = useState<string | null>(null);
  const [dataType, setDataType] = useState<'text' | 'image' | 'none'>('none');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readClipboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to read image first
      try {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const url = URL.createObjectURL(blob);
              setClipboardData(url);
              setDataType('image');
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        // Image not available, try text
      }

      // Try to read text
      const text = await navigator.clipboard.readText();
      if (text) {
        setClipboardData(text);
        setDataType('text');
      } else {
        setDataType('none');
        setError('No content found in clipboard');
      }
    } catch (err) {
      setError('Clipboard access denied. Please allow clipboard permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    if (dataType === 'text' && clipboardData) {
      onText(clipboardData);
      onClose();
    } else if (dataType === 'image' && clipboardData) {
      const response = await fetch(clipboardData);
      const blob = await response.blob();
      const file = new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type });
      onCapture(file);
      onClose();
    }
  };

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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
            <Clipboard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Scan from Clipboard</h2>
            <p className="text-gray-400 text-sm">Import data or image from clipboard</p>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={readClipboard}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Reading Clipboard...
              </>
            ) : (
              <>
                <Clipboard size={20} />
                Read from Clipboard
              </>
            )}
          </button>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          {dataType !== 'none' && clipboardData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20"
            >
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-sm font-medium">
                  {dataType === 'image' ? 'Image found!' : 'Text data found!'}
                </span>
              </div>

              {dataType === 'image' ? (
                <img src={clipboardData} alt="Clipboard" className="w-full h-40 object-contain rounded-lg bg-black/20" />
              ) : (
                <div className="p-3 rounded-lg bg-black/20 text-gray-300 text-sm font-mono break-all max-h-32 overflow-y-auto">
                  {clipboardData.slice(0, 500)}
                  {clipboardData.length > 500 && '...'}
                </div>
              )}
            </motion.div>
          )}

          {dataType !== 'none' && (
            <button
              onClick={handleScan}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-400 hover:to-orange-400 transition-all"
            >
              <Check size={20} />
              Scan This Content
            </button>
          )}
        </div>

        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-gray-400 text-xs">
            <strong className="text-white">Tip:</strong> Copy an image or product barcode/ID to your clipboard, then click "Read from Clipboard" to import it directly.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
