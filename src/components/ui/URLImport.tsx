import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link2, X, Download, Loader2, AlertCircle } from 'lucide-react';

interface URLImportProps {
  onImport: (url: string) => void;
  onClose: () => void;
}

export const URLImport = ({ onImport, onClose }: URLImportProps) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (input: string): boolean => {
    try {
      new URL(input);
      return true;
    } catch {
      return false;
    }
  };

  const handleImport = async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!validateUrl(url)) {
      setError('Please enter a valid URL');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      onImport(url.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import image');
    } finally {
      setLoading(false);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && validateUrl(text)) {
        setUrl(text);
      }
    } catch {
      // Clipboard access denied
    }
  };

  const sampleUrls = [
    { label: 'Sample Food Label', url: 'http://localhost:8001/api/sample/food' },
    { label: 'Sample Beverage', url: 'http://localhost:8001/api/sample/beverage' },
    { label: 'Sample Cosmetic', url: 'http://localhost:8001/api/sample/cosmetic' },
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

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Link2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Import from URL</h2>
            <p className="text-gray-400 text-sm">Paste an image URL to scan</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="url"
              value={url}
              onChange={(e) => { setUrl(e.target.value); setError(null); }}
              placeholder="https://example.com/product-label.jpg"
              className="w-full px-4 py-3 pr-24 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 outline-none transition-colors"
            />
            <button
              onClick={handlePaste}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-sm hover:bg-white/10 hover:text-white transition-colors"
            >
              Paste
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={loading || !url.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium disabled:opacity-50 hover:from-blue-400 hover:to-cyan-400 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Download size={20} />
                Import & Scan
              </>
            )}
          </button>
        </div>

        {/* Sample URLs */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <p className="text-gray-500 text-xs mb-3">Try with sample URLs:</p>
          <div className="flex flex-wrap gap-2">
            {sampleUrls.map((sample, i) => (
              <button
                key={i}
                onClick={() => setUrl(sample.url)}
                className="px-3 py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-colors"
              >
                {sample.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
