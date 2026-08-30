import { motion } from 'framer-motion';
import { BookOpen, ExternalLink } from 'lucide-react';
import type { LegalReference } from '../../types/legal';

interface KeyReferencesProps {
  references: LegalReference[];
}

export const KeyReferences = ({ references }: KeyReferencesProps) => {
  if (references.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/[0.02] border border-white/5 p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <BookOpen className="w-5 h-5 text-teal-400" />
        <h3 className="text-lg font-semibold text-white">Key Legal References</h3>
      </div>

      <div className="grid gap-3">
        {references.slice(0, 10).map((ref, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between p-4 rounded-lg bg-white/[0.02] border border-white/5 hover:border-teal-500/30 transition-colors group"
          >
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">{ref.fullCitation}</div>
              <div className="text-gray-500 text-sm truncate">{ref.description}</div>
            </div>
            <div className="flex items-center gap-2 text-gray-500 text-xs">
              <span className="px-2 py-1 rounded bg-white/5 font-mono">{ref.section}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
