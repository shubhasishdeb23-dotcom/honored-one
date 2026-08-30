import { motion } from 'framer-motion';
import { FileText, FileJson, Download, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import type { ReportData } from '../../types/legal';
import { generatePDFReport, generateTextReport, generateHTMLReport } from '../../utils/pdfGenerator';

interface ExportButtonsProps {
  report: ReportData;
}

export const ExportButtons = ({ report }: ExportButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const summary = `
Legal Compliance Report - ${report.title}
Generated: ${new Date(report.generatedAt).toLocaleString()}
Total Violations: ${report.summary.totalViolations}
High: ${report.summary.highSeverity} | Medium: ${report.summary.mediumSeverity} | Low: ${report.summary.lowSeverity}

Key Legal References:
${report.summary.keyReferences.map(r => `- ${r.fullCitation}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadJSON = () => {
    const data = JSON.stringify(report, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legal-report-${report.id.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-wrap gap-3">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => generatePDFReport(report)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-400 hover:border-teal-500/50 transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">PDF Report</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDownloadJSON}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
      >
        <FileJson className="w-4 h-4" />
        <span className="text-sm font-medium">JSON</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => generateTextReport(report)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
      >
        <Download className="w-4 h-4" />
        <span className="text-sm font-medium">TXT</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => generateHTMLReport(report)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">HTML</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleCopy}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
      >
        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
      </motion.button>
    </div>
  );
};
