import { motion } from 'framer-motion';
import { AlertTriangle, Scale } from 'lucide-react';

interface DisclaimerBannerProps {
  disclaimer: string;
}

export const DisclaimerBanner = ({ disclaimer }: DisclaimerBannerProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-red-500/10 border border-amber-500/20 p-6"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>
        <div>
          <h4 className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Legal Disclaimer
          </h4>
          <p className="text-amber-400/80 text-sm leading-relaxed">{disclaimer}</p>
        </div>
      </div>
    </motion.div>
  );
};
