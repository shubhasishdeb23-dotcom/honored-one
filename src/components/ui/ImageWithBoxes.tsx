import { useState } from 'react';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import type { OCRResult } from '../../context/LabelGuardContext';

interface ImageWithBoxesProps {
  src: string;
  boxes: OCRResult[];
  showBoxes: boolean;
}

export const ImageWithBoxes = ({ src, boxes, showBoxes }: ImageWithBoxesProps) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  const getBoxColor = (confidence: number) => {
    if (confidence >= 0.85) return { border: 'border-emerald-500', bg: 'bg-emerald-500/10' };
    if (confidence >= 0.7) return { border: 'border-cyan-500', bg: 'bg-cyan-500/10' };
    if (confidence >= 0.5) return { border: 'border-amber-500', bg: 'bg-amber-500/10' };
    return { border: 'border-red-500', bg: 'bg-red-500/10' };
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/20">
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={() => setScale(Math.min(scale + 0.25, 3))}
          className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={() => setScale(Math.max(scale - 0.25, 0.5))}
          className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={() => setRotation((rotation + 90) % 360)}
          className="w-8 h-8 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
        >
          <RotateCw size={16} />
        </button>
      </div>

      <div className="relative overflow-auto max-h-[500px]">
        <div
          className="relative inline-block min-w-full"
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transformOrigin: 'center',
            transition: 'transform 0.3s ease',
          }}
        >
          <img
            src={src}
            alt="Scanned product"
            className="w-full h-auto"
            style={{ maxHeight: '500px', objectFit: 'contain' }}
          />

          {showBoxes && boxes.map((box, i) => {
            const [x1, y1, x2, y2] = box.bbox;
            const colors = getBoxColor(box.confidence);
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`absolute border-2 ${colors.border} ${colors.bg} rounded cursor-pointer hover:bg-opacity-30 transition-all`}
                style={{
                  left: `${x1}px`,
                  top: `${y1}px`,
                  width: `${x2 - x1}px`,
                  height: `${y2 - y1}px`,
                }}
                title={`${box.text}\nConfidence: ${(box.confidence * 100).toFixed(0)}%`}
              >
                <span className="absolute -top-5 left-0 text-[10px] bg-black/70 text-white px-1 rounded whitespace-nowrap">
                  {(box.confidence * 100).toFixed(0)}%
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>

      {showBoxes && (
        <div className="absolute bottom-4 left-4 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-emerald-500 bg-emerald-500/20" />
            <span className="text-gray-400">High (≥85%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-cyan-500 bg-cyan-500/20" />
            <span className="text-gray-400">Good (≥70%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-amber-500 bg-amber-500/20" />
            <span className="text-gray-400">Low (≥50%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-500/20" />
            <span className="text-gray-400">Very Low</span>
          </div>
        </div>
      )}
    </div>
  );
};
