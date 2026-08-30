import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, FileJson, Copy, Check, Volume2, File } from 'lucide-react';
import type { ScanResult } from '../../context/LabelGuardContext';

interface ExportButtonsProps {
  result: ScanResult;
  onOpenPDFReport: () => void;
}

export const ExportButtons = ({ result, onOpenPDFReport }: ExportButtonsProps) => {
  const [copied, setCopied] = useState(false);

  const downloadJSON = () => {
    const data = JSON.stringify(result, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labelguard-scan-${result.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    const passed = result.compliance.checks.filter(c => c.status === 'PASS').length;
    const failed = result.compliance.checks.filter(c => c.status === 'FAIL').length;
    const review = result.compliance.checks.filter(c => c.status === 'REVIEW').length;

    const content = `
LABELGUARD AI - COMPLIANCE ASSESSMENT REPORT
============================================
Generated: ${new Date(result.timestamp).toLocaleString()}
Scan ID: ${result.id}
Scan Type: ${result.scan_type || 'upload'}
${result.barcode ? `Barcode/QR: ${result.barcode}` : ''}

COMPLIANCE SUMMARY
------------------
Score: ${result.compliance.score}/100
Risk Level: ${result.compliance.risk_level}

Checks: ${passed} PASS | ${failed} FAIL | ${review} REVIEW

PRODUCT DETAILS
--------------
${Object.entries(result.product)
  .filter(([_, v]) => v)
  .map(([k, v]) => `${k.replace(/_/g, ' ').toUpperCase()}: ${v}`)
  .join('\n')}

COMPLIANCE CHECKS
----------------
${result.compliance.checks.map(c => 
  `[${c.status}] ${c.field}: ${c.value || 'NOT FOUND'} (${(c.confidence * 100).toFixed(0)}% confidence)`
).join('\n')}

DISCLAIMER
----------
This is an AI-assisted compliance assessment for educational purposes.
Final legal determination rests with an authorized officer.

LabelGuard AI - SIH26034: Packaged Commodity Compliance Scanner
Smart India Hackathon 2026
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labelguard-report-${result.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadHTML = () => {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LabelGuard AI Report - ${result.id}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #0a0a0a; color: #fff; }
    .header { text-align: center; margin-bottom: 40px; }
    .score { font-size: 48px; font-weight: bold; color: ${result.compliance.score >= 80 ? '#10b981' : result.compliance.score >= 50 ? '#f59e0b' : '#ef4444'}; }
    .check { padding: 10px; margin: 5px 0; border-radius: 8px; }
    .PASS { background: rgba(16,185,129,0.1); border-left: 4px solid #10b981; }
    .FAIL { background: rgba(239,68,68,0.1); border-left: 4px solid #ef4444; }
    .REVIEW { background: rgba(245,158,11,0.1); border-left: 4px solid #f59e0b; }
    .disclaimer { background: rgba(245,158,11,0.1); padding: 15px; border-radius: 8px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>LabelGuard AI Report</h1>
    <p>Generated: ${new Date(result.timestamp).toLocaleString()}</p>
    <div class="score">${result.compliance.score}/100</div>
    <p>Risk Level: ${result.compliance.risk_level}</p>
  </div>
  <h2>Product Details</h2>
  <ul>
    ${Object.entries(result.product).filter(([_, v]) => v).map(([k, v]) => `<li><strong>${k}:</strong> ${v}</li>`).join('')}
  </ul>
  <h2>Compliance Checks</h2>
  ${result.compliance.checks.map(c => `<div class="check ${c.status}"><strong>${c.field}:</strong> ${c.status} (${(c.confidence * 100).toFixed(0)}%)</div>`).join('')}
  <div class="disclaimer">
    <strong>Disclaimer:</strong> This is an AI-assisted compliance assessment. Final legal determination rests with an authorized officer.
  </div>
</body>
</html>
    `.trim();

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `labelguard-report-${result.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySummary = () => {
    const summary = `LabelGuard AI Scan Result:
Score: ${result.compliance.score}/100
Risk: ${result.compliance.risk_level}
${result.compliance.checks.filter(c => c.status === 'PASS').length} PASS, ${result.compliance.checks.filter(c => c.status === 'FAIL').length} FAIL, ${result.compliance.checks.filter(c => c.status === 'REVIEW').length} REVIEW
${result.compliance.note}`;
    
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const speakResult = () => {
    const text = `This product scored ${result.compliance.score} percent, risk level ${result.compliance.risk_level.toLowerCase()}. ${result.compliance.note}`;
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-400">Export Results</h3>
      <div className="flex flex-wrap gap-3">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onOpenPDFReport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-cyan-500/20 border border-teal-500/30 text-teal-400 hover:border-teal-500/50 transition-colors"
        >
          <File className="w-4 h-4" />
          <span className="text-sm font-medium">PDF Report</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadJSON}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <FileJson size={16} />
          <span className="text-sm font-medium">JSON</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadTXT}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <FileText size={16} />
          <span className="text-sm font-medium">TXT</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={downloadHTML}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <FileText size={16} />
          <span className="text-sm font-medium">HTML</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={copySummary}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
          <span className="text-sm font-medium">{copied ? 'Copied!' : 'Copy'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={speakResult}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
        >
          <Volume2 size={16} />
          <span className="text-sm font-medium">Hear</span>
        </motion.button>
      </div>
    </div>
  );
};
