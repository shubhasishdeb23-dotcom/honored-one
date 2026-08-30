import { motion } from 'framer-motion';
import { AlertTriangle, Shield, AlertCircle, Info } from 'lucide-react';
import type { ReportData } from '../../types/legal';

interface SummaryCardsProps {
  report: ReportData;
}

export const SummaryCards = ({ report }: SummaryCardsProps) => {
  const stats = [
    {
      label: 'Total Violations',
      value: report.summary.totalViolations,
      icon: AlertTriangle,
      color: 'from-teal-500 to-cyan-500',
      textColor: 'text-teal-400',
    },
    {
      label: 'High Severity',
      value: report.summary.highSeverity,
      icon: Shield,
      color: 'from-red-500 to-rose-500',
      textColor: 'text-red-400',
    },
    {
      label: 'Medium Severity',
      value: report.summary.mediumSeverity,
      icon: AlertCircle,
      color: 'from-orange-500 to-amber-500',
      textColor: 'text-orange-400',
    },
    {
      label: 'Low Severity',
      value: report.summary.lowSeverity,
      icon: Info,
      color: 'from-yellow-500 to-amber-500',
      textColor: 'text-yellow-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative overflow-hidden rounded-xl bg-white/[0.02] border border-white/5 p-6 group hover:border-white/10 transition-colors"
        >
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${stat.color} opacity-10 rounded-full blur-xl group-hover:opacity-20 transition-opacity`} />
          
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
          </div>
          
          <div className={`text-4xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
          <div className="text-gray-500 text-sm">{stat.label}</div>
        </motion.div>
      ))}
    </div>
  );
};
