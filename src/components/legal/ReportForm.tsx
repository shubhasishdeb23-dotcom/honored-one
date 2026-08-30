import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import type { ReportFormInput } from '../../types/legal';

interface ReportFormProps {
  onSubmit: (data: ReportFormInput) => void;
  isLoading: boolean;
}

export const ReportForm = ({ onSubmit, isLoading }: ReportFormProps) => {
  const [formData, setFormData] = useState<ReportFormInput>({
    examples: '',
    reportTitle: '',
    analysisDepth: 'detailed',
  });
  const [errors, setErrors] = useState<{ examples?: string }>({});

  const validate = (): boolean => {
    const newErrors: { examples?: string } = {};
    
    if (!formData.examples.trim()) {
      newErrors.examples = 'Please enter at least one example for analysis';
    } else if (formData.examples.trim().length < 10) {
      newErrors.examples = 'Example must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onSubmit(formData);
    }
  };

  const examplePlaceholders = [
    'A person was caught stealing credit card information from an online shopping website...',
    'A company published misleading advertisements about their health products...',
    'An employee faced harassment at workplace and was threatened with termination...',
    'A website was found distributing copyrighted movies without permission...',
  ];

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      {/* Report Title */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Report Title (Optional)
        </label>
        <input
          type="text"
          value={formData.reportTitle}
          onChange={(e) => setFormData({ ...formData, reportTitle: e.target.value })}
          placeholder="e.g., Legal Compliance Analysis for Case XYZ"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500/50 focus:outline-none transition-colors"
        />
      </div>

      {/* Examples Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Examples for Analysis <span className="text-red-400">*</span>
        </label>
        <div className="relative">
          <textarea
            value={formData.examples}
            onChange={(e) => {
              setFormData({ ...formData, examples: e.target.value });
              if (errors.examples) setErrors({});
            }}
            placeholder={examplePlaceholders[Math.floor(Math.random() * examplePlaceholders.length)]}
            rows={8}
            className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
              errors.examples ? 'border-red-500/50' : 'border-white/10'
            } text-white placeholder:text-gray-500 focus:border-teal-500/50 focus:outline-none transition-colors resize-none`}
          />
          {errors.examples && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-6 left-0 flex items-center gap-1 text-red-400 text-xs"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errors.examples}
            </motion.div>
          )}
        </div>
        <p className="text-gray-500 text-xs mt-2">
          Enter one or more examples separated by blank lines. Each example will be analyzed for potential legal violations.
        </p>
      </div>

      {/* Analysis Depth */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Analysis Depth
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(['basic', 'detailed', 'comprehensive'] as const).map((depth) => (
            <button
              key={depth}
              type="button"
              onClick={() => setFormData({ ...formData, analysisDepth: depth })}
              className={`px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                formData.analysisDepth === depth
                  ? 'bg-teal-500/10 border-teal-500/50 text-teal-400'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {depth.charAt(0).toUpperCase() + depth.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        type="submit"
        disabled={isLoading}
        whileHover={{ scale: isLoading ? 1 : 1.02 }}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold disabled:opacity-50 hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/20"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Legal Report
          </>
        )}
      </motion.button>
    </motion.form>
  );
};
