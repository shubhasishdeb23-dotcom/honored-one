import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, FileSearch, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReportForm } from '../components/legal/ReportForm';
import { ReportHeader } from '../components/legal/ReportHeader';
import { SummaryCards } from '../components/legal/SummaryCards';
import { ViolationCard } from '../components/legal/ViolationCard';
import { CategoryBreakdown } from '../components/legal/CategoryBreakdown';
import { KeyReferences } from '../components/legal/KeyReferences';
import { DisclaimerBanner } from '../components/legal/DisclaimerBanner';
import { ExportButtons } from '../components/legal/ExportButtons';
import { generateReport } from '../utils/reportGenerator';
import type { ReportData, ReportFormInput } from '../types/legal';

export const LegalReportPage = () => {
  const [report, setReport] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSubmit = useCallback(async (data: ReportFormInput) => {
    setIsLoading(true);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    
    const examples = data.examples
      .split(/\n\s*\n/)
      .map(e => e.trim())
      .filter(e => e.length > 0);
    
    const generatedReport = generateReport(examples, data.reportTitle);
    setReport(generatedReport);
    setIsLoading(false);
    setShowResults(true);
  }, []);

  const handleReset = () => {
    setReport(null);
    setShowResults(false);
  };

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 mb-6">
            <Scale className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">Legal Compliance Analysis</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Legal Compliance Report
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Analyze examples against Indian law and generate detailed compliance reports with legal citations
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!showResults ? (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-3xl mx-auto"
            >
              <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                    <FileSearch className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">Analyze Legal Compliance</h2>
                    <p className="text-gray-500 text-sm">Enter examples to check against Indian law</p>
                  </div>
                </div>
                
                <ReportForm onSubmit={handleSubmit} isLoading={isLoading} />
              </div>

              {/* Loading Overlay */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
                >
                  <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 p-8 text-center">
                    <Loader2 className="w-12 h-12 text-teal-400 animate-spin mx-auto mb-4" />
                    <h3 className="text-white font-semibold mb-2">Analyzing Examples</h3>
                    <p className="text-gray-400 text-sm">Checking against Indian legal database...</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : report && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Back Button */}
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                New Analysis
              </button>

              {/* Report Header */}
              <ReportHeader report={report} />

              {/* Summary Cards */}
              <SummaryCards report={report} />

              {/* Export Buttons */}
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Export Report</h2>
                <ExportButtons report={report} />
              </div>

              {/* Violations */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Violations Found ({report.violations.length})
                </h2>
                <div className="space-y-4">
                  {report.violations.map((violation, index) => (
                    <ViolationCard key={violation.id} violation={violation} index={index} />
                  ))}
                </div>
              </div>

              {/* Category Breakdown & Key References */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CategoryBreakdown report={report} />
                <KeyReferences references={report.summary.keyReferences} />
              </div>

              {/* Disclaimer */}
              <DisclaimerBanner disclaimer={report.disclaimer} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
