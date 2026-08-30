import { motion } from 'framer-motion';
import { AlertTriangle, BookOpen, Scale, FileText } from 'lucide-react';
import type { Violation } from '../../types/legal';
import { SEVERITY_COLORS, CATEGORY_COLORS, CATEGORY_LABELS } from '../../data/legalDatabase';

interface ViolationCardProps {
  violation: Violation;
  index: number;
}

export const ViolationCard = ({ violation, index }: ViolationCardProps) => {
  const colors = SEVERITY_COLORS[violation.severity];
  const categoryColor = CATEGORY_COLORS[violation.category];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`relative overflow-hidden rounded-xl ${colors.bg} border ${colors.border} p-6 hover:shadow-lg transition-shadow`}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Severity Badge */}
        <div className="flex items-center gap-3 lg:flex-col lg:items-start">
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase ${colors.text} ${colors.bg} border ${colors.border}`}>
            {violation.severity}
          </span>
          <span className={`px-3 py-1 rounded-lg text-xs font-medium bg-gradient-to-r ${categoryColor} text-white`}>
            {CATEGORY_LABELS[violation.category]}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white mb-2">
            {violation.violationDescription}
          </h3>

          {/* Legal References */}
          <div className="mb-4">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Applicable Laws</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {violation.legalReferences.map((ref, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono"
                  title={ref.description}
                >
                  {ref.fullCitation}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Explanation */}
          <div className="bg-white/[0.02] rounded-lg p-4 border border-white/5">
            <div className="flex items-center gap-2 text-gray-400 text-xs mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>Legal Analysis</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{violation.explanation}</p>
          </div>

          {/* Punishment */}
          {violation.punishment && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-amber-400">Punishment: </span>
              <span className="text-gray-400">{violation.punishment}</span>
            </div>
          )}
        </div>
      </div>

      {/* Example snippet */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
          <FileText className="w-3.5 h-3.5" />
          <span>Analyzed Example</span>
        </div>
        <p className="text-gray-400 text-sm italic truncate">{violation.example}</p>
      </div>
    </motion.div>
  );
};
