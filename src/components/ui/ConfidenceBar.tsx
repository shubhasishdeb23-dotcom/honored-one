import { motion } from 'framer-motion';

interface ConfidenceBarProps {
  confidence: number;
  showLabel?: boolean;
}

export const ConfidenceBar = ({ confidence, showLabel = true }: ConfidenceBarProps) => {
  const percentage = Math.round(confidence * 100);
  
  const getColor = () => {
    if (confidence >= 0.85) return 'bg-emerald-500';
    if (confidence >= 0.7) return 'bg-cyan-500';
    if (confidence >= 0.5) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className={`h-full ${getColor()} rounded-full`}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-400 w-10 text-right">{percentage}%</span>
      )}
    </div>
  );
};
