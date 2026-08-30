import { motion } from 'framer-motion';
import { Shield, AlertTriangle, ShieldAlert } from 'lucide-react';

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

interface RiskIndicatorProps {
  level: RiskLevel;
}

export const RiskIndicator = ({ level }: RiskIndicatorProps) => {
  const config = {
    LOW: {
      icon: Shield,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/30',
      label: 'Low Risk',
      description: 'Product appears compliant',
    },
    MEDIUM: {
      icon: AlertTriangle,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
      label: 'Medium Risk',
      description: 'Review recommended',
    },
    HIGH: {
      icon: ShieldAlert,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      label: 'High Risk',
      description: 'Non-compliance detected',
    },
  };

  const { icon: Icon, color, bg, border, label, description } = config[level];

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-4 p-4 rounded-xl ${bg} border ${border}`}
    >
      <div className={`w-12 h-12 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
      <div>
        <h4 className={`font-semibold ${color}`}>{label}</h4>
        <p className="text-sm text-gray-400">{description}</p>
      </div>
    </motion.div>
  );
};
