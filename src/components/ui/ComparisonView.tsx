import { motion } from 'framer-motion';
import { ArrowLeftRight, Check, X, AlertTriangle } from 'lucide-react';
import type { ScanResult } from '../../context/LabelGuardContext';

interface ComparisonViewProps {
  results: ScanResult[];
  onClose: () => void;
}

export const ComparisonView = ({ results, onClose }: ComparisonViewProps) => {
  if (results.length < 2) return null;

  const allFields = results[0].compliance.checks.map(c => c.field);

  const getFieldStatus = (result: ScanResult, field: string) => {
    const check = result.compliance.checks.find(c => c.field === field);
    return check?.status || 'FAIL';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return <Check className="w-4 h-4 text-emerald-400" />;
      case 'FAIL': return <X className="w-4 h-4 text-red-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-amber-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'PASS': return 'bg-emerald-500/10';
      case 'FAIL': return 'bg-red-500/10';
      default: return 'bg-amber-500/10';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/90 overflow-auto p-4"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <ArrowLeftRight className="w-6 h-6 text-teal-400" />
            <h2 className="text-2xl font-bold text-white">Comparison View</h2>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Header Row */}
        <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: `200px repeat(${results.length}, 1fr)` }}>
          <div className="p-4 rounded-xl bg-white/5">
            <span className="text-gray-400 text-sm">Field / Image</span>
          </div>
          {results.map((result, i) => (
            <div key={i} className="p-4 rounded-xl bg-white/5">
              <img
                src={result.image_path}
                alt={`Scan ${i + 1}`}
                className="w-full h-32 object-cover rounded-lg mb-3"
              />
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{result.compliance.score}</div>
                <div className={`text-xs font-medium ${
                  result.compliance.risk_level === 'LOW' ? 'text-emerald-400' :
                  result.compliance.risk_level === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {result.compliance.risk_level} Risk
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison Grid */}
        <div className="space-y-2">
          {allFields.map((field) => (
            <div
              key={field}
              className="grid gap-4"
              style={{ gridTemplateColumns: `200px repeat(${results.length}, 1fr)` }}
            >
              <div className="p-3 rounded-xl bg-white/[0.02] flex items-center">
                <span className="text-gray-300 text-sm capitalize">
                  {field.replace(/_/g, ' ')}
                </span>
              </div>
              {results.map((result, i) => {
                const status = getFieldStatus(result, field);
                return (
                  <div
                    key={i}
                    className={`p-3 rounded-xl ${getStatusBg(status)} flex items-center justify-center gap-2`}
                  >
                    {getStatusIcon(status)}
                    <span className={`text-sm font-medium ${
                      status === 'PASS' ? 'text-emerald-400' :
                      status === 'FAIL' ? 'text-red-400' : 'text-amber-400'
                    }`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-teal-500/10 to-cyan-500/5 border border-teal-500/20">
          <h3 className="text-lg font-semibold text-white mb-4">Comparison Summary</h3>
          <div className="grid grid-cols-3 gap-4">
            {results.map((result, i) => (
              <div key={i} className="text-center">
                <div className="text-gray-400 text-sm mb-1">Image {i + 1}</div>
                <div className="text-white font-medium">
                  {result.compliance.checks.filter(c => c.status === 'PASS').length}/{result.compliance.checks.length} passed
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
