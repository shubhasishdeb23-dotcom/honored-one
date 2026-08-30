import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Video, X, Play, Pause, Upload } from 'lucide-react';

interface VideoScannerProps {
  onFramesExtracted: (frames: File[]) => void;
  onClose: () => void;
}

export const VideoScanner = ({ onFramesExtracted, onClose }: VideoScannerProps) => {
  const [videoSrc, setVideoSrc] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [extracting, setExtracting] = useState(false);
  const [extractedFrames, setExtractedFrames] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const url = URL.createObjectURL(e.target.files[0]);
      setVideoSrc(url);
      setExtractedFrames([]);
      setCurrentFrame(0);
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const extractFrames = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setExtracting(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const frames: string[] = [];
    const duration = video.duration;
    const frameCount = 5;
    const interval = duration / (frameCount + 1);

    for (let i = 1; i <= frameCount; i++) {
      video.currentTime = i * interval;
      await new Promise<void>((resolve) => {
        video.onseeked = () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0);
          frames.push(canvas.toDataURL('image/jpeg', 0.8));
          resolve();
        };
      });
    }

    setExtractedFrames(frames);
    setExtracting(false);
  };

  const useExtractedFrames = () => {
    const files: File[] = extractedFrames.map((dataUrl, i) => {
      const byteString = atob(dataUrl.split(',')[1]);
      const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let j = 0; j < byteString.length; j++) {
        ia[j] = byteString.charCodeAt(j);
      }
      return new File([ab], `video-frame-${i + 1}.jpg`, { type: mimeString });
    });
    onFramesExtracted(files);
    onClose();
  };

  useEffect(() => {
    return () => {
      if (videoSrc) {
        URL.revokeObjectURL(videoSrc);
      }
    };
  }, [videoSrc]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
    >
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent z-10">
        <h2 className="text-white font-semibold">Video Scanner</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        {!videoSrc ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full max-w-lg aspect-video bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500/50 transition-colors"
          >
            <Video className="w-16 h-16 text-gray-600 mb-4" />
            <p className="text-gray-400">Click to upload a video</p>
            <p className="text-gray-600 text-sm mt-2">MP4, MOV, AVI supported</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleVideoUpload}
            />
          </div>
        ) : (
          <div className="w-full max-w-3xl">
            <video
              ref={videoRef}
              src={videoSrc}
              className="w-full rounded-2xl"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Extracted Frames Preview */}
            {extractedFrames.length > 0 && (
              <div className="mt-6">
                <h3 className="text-white font-medium mb-3">Extracted Frames ({extractedFrames.length})</h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {extractedFrames.map((frame, i) => (
                    <img
                      key={i}
                      src={frame}
                      alt={`Frame ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-white/10"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {videoSrc && (
        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex justify-center gap-4">
            {extractedFrames.length === 0 ? (
              <button
                onClick={extractFrames}
                disabled={extracting}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium disabled:opacity-50 hover:from-teal-400 hover:to-cyan-400 transition-all"
              >
                {extracting ? 'Extracting...' : 'Extract Frames'}
              </button>
            ) : (
              <button
                onClick={useExtractedFrames}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
              >
                Use These Frames
              </button>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
