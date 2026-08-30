import { motion } from 'framer-motion';
import { Scale, Calendar, FileText } from 'lucide-react';
import type { ReportData } from '../../types/legal';

interface ReportHeaderProps {
  report: ReportData;
}

export const ReportHeader = ({ report }: ReportHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-indigo-500/10 border border-white/10 p-8"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Scale className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{report.title}</h1>
            <p className="text-gray-400">Legal Compliance Analysis Report</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            <FileText className="w-4 h-4" />
            <span>Report ID: <span className="text-white font-mono">{report.id.slice(0, 8)}</span></span>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Generated: <span className="text-white">{new Date(report.generatedAt).toLocaleString()}</span></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
