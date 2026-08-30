import { motion } from 'framer-motion';

interface ScanningProgressProps {
  progress: number;
  stage: string;
}

const stages = [
  { id: 'init', label: 'Initializing', icon: '⚙️' },
  { id: 'ocr', label: 'Reading Text', icon: '👁️' },
  { id: 'extract', label: 'Extracting Fields', icon: '📝' },
  { id: 'rules', label: 'Checking Rules', icon: '📋' },
  { id: 'report', label: 'Generating Report', icon: '📊' },
];

export const ScanningProgress = ({ progress, stage }: ScanningProgressProps) => {
  const currentStageIndex = stages.findIndex(s => stage.toLowerCase().includes(s.label.toLowerCase()));

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex justify-between mb-4">
        {stages.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0.3 }}
            animate={{
              opacity: i <= currentStageIndex ? 1 : 0.3,
              scale: i === currentStageIndex ? 1.1 : 1,
            }}
            className="flex flex-col items-center"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-2 transition-all duration-300 ${
                i < currentStageIndex
                  ? 'bg-emerald-500/20 border-2 border-emerald-500'
                  : i === currentStageIndex
                  ? 'bg-teal-500/20 border-2 border-teal-500 animate-pulse'
                  : 'bg-white/5 border-2 border-white/10'
              }`}
            >
              {i < currentStageIndex ? '✓' : s.icon}
            </div>
            <span className={`text-xs ${i <= currentStageIndex ? 'text-white' : 'text-gray-500'}`}>
              {s.label}
            </span>
          </motion.div>
        ))}
      </div>

      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
        />
      </div>

      <motion.p
        key={stage}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center text-gray-400 text-sm mt-4"
      >
        {stage}
      </motion.p>
    </div>
  );
};
