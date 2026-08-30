import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { QrCode, X, Keyboard, Camera, Upload, Link2 } from 'lucide-react';

interface QRScannerProps {
  onCapture: (file: File) => void;
  onText: (text: string) => void;
  onClose: () => void;
}

export const QRScanner = ({ onCapture, onText, onClose }: QRScannerProps) => {
  const [showManual, setShowManual] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = mediaStream;
      setCameraOn(true);
    } catch {
      setError('Camera access denied. Please allow camera permissions or upload an image instead.');
    }
  }, []);

  useEffect(() => {
    if (cameraOn && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOn]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `qr-${Date.now()}.jpg`, { type: 'image/jpeg' });
        stopCamera();
        onCapture(file);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) onCapture(f);
  };

  const handleManualSubmit = () => {
    if (manualInput.trim()) {
      onText(manualInput.trim());
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="relative flex-1 flex items-center justify-center">
        {cameraOn ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-8 border-2 border-white/30 rounded-2xl">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />
              </div>
              <p className="absolute bottom-32 left-0 right-0 text-center text-white/70 text-sm">
                Point camera at the QR code then tap Capture
              </p>
            </div>
          </>
        ) : (
          <div className="w-full max-w-md aspect-square relative">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-cyan-500/10 rounded-3xl border border-white/10 flex items-center justify-center">
              {error ? (
                <div className="text-center px-8">
                  <p className="text-gray-400 text-sm mb-4">{error}</p>
                </div>
              ) : (
                <div className="text-center">
                  <QrCode className="w-24 h-24 text-teal-400/50 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Scan a QR code from a photo, camera or file</p>
                </div>
              )}
            </div>
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-teal-400 rounded-tl-xl" />
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-teal-400 rounded-tr-xl" />
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-teal-400 rounded-bl-xl" />
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-teal-400 rounded-br-xl" />
          </div>
        )}
      </div>

      {/* Manual Input Panel */}
      {showManual && !cameraOn && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="absolute bottom-0 left-0 right-0 p-6 bg-[#0a0a0a] border-t border-white/10"
        >
          <h3 className="text-white font-semibold mb-3">Enter Barcode/Product ID</h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Enter barcode number or product ID..."
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500/50 outline-none"
              onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
            />
            <button
              onClick={handleManualSubmit}
              disabled={!manualInput.trim()}
              className="px-6 py-3 rounded-xl bg-teal-500 text-white font-medium disabled:opacity-50 hover:bg-teal-400 transition-colors"
            >
              Analyze
            </button>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white font-semibold">Scan QR Code</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        <div className="flex justify-center gap-4 items-center">
          {cameraOn ? (
            <button
              onClick={handleCapture}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:bg-gray-100 transition-colors"
            >
              <div className="w-16 h-16 rounded-full border-4 border-teal-500" />
            </button>
          ) : (
            <>
              <button
                onClick={() => (cameraOn ? stopCamera() : startCamera())}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition-colors"
              >
                <Camera size={20} />
                Use Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-teal-500 text-white font-medium hover:bg-teal-400 transition-colors"
              >
                <Upload size={20} />
                Upload QR Image
              </button>
              <button
                onClick={() => setShowManual(!showManual)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl ${showManual ? 'bg-teal-500' : 'bg-white/10'} text-white font-medium hover:bg-teal-400 transition-colors`}
              >
                <Keyboard size={20} />
                Manual Entry
              </button>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <Link2 size={20} />
              </button>
            </>
          )}
        </div>
        {cameraOn && (
          <div className="text-center mt-3">
            <button onClick={stopCamera} className="text-gray-400 text-sm hover:text-white transition-colors">
              Cancel camera
            </button>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </motion.div>
  );
};
