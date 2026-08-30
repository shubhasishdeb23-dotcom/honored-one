import { motion } from 'framer-motion';
import { Upload, Eye, Brain, Scale, FileText, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload Image',
    description: 'Upload one or more photos of a packaged product\'s label. Supports JPG, PNG, and other common formats.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Eye,
    title: 'OCR Reading',
    description: 'PaddleOCR reads all visible text on the label, extracting text with bounding boxes and confidence scores.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Brain,
    title: 'AI Field Extraction',
    description: 'Local LLM (Ollama) or regex fallback extracts 10 mandatory fields: product name, manufacturer, MRP, quantity, dates, etc.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: Scale,
    title: 'Rule Engine Check',
    description: 'Deterministic rules (NOT AI) check each field against Legal Metrology requirements. AI reads, rules decide.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: FileText,
    title: 'Generate Report',
    description: 'Get a compliance score (0-100), risk level, and detailed report with PASS/FAIL/REVIEW status for each check.',
    color: 'from-purple-500 to-pink-500',
  },
];

const verdicts = [
  {
    status: 'PASS',
    icon: CheckCircle2,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    description: 'Field is present and clearly readable with high OCR confidence (≥70%).',
  },
  {
    status: 'FAIL',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    description: 'Field is missing and OCR confidence is high enough to be certain (≥70%).',
  },
  {
    status: 'REVIEW',
    icon: AlertTriangle,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    description: 'OCR confidence is low (<70%) - manual verification is required. We never guess.',
  },
];

const rules = [
  { field: 'Product Name', rule: 'Rule 6(1)(a)', description: 'Name or trade name of the commodity' },
  { field: 'Manufacturer', rule: 'Rule 6(1)(b)', description: 'Name and address of manufacturer/packer' },
  { field: 'Net Quantity', rule: 'Rule 6(1)(c)', description: 'Net weight, measure, or number' },
  { field: 'MRP', rule: 'Rule 6(1)(d)', description: 'Maximum Retail Price inclusive of taxes' },
  { field: 'Mfg Date', rule: 'Rule 6(1)(e)', description: 'Month and year of manufacture' },
  { field: 'Best Before', rule: 'Rule 6(1)(f)', description: 'Best before/use by date for perishables' },
  { field: 'Origin', rule: 'Rule 6(1)(i)', description: 'Country of origin for imported goods' },
  { field: 'Consumer Care', rule: 'Rule 6(1)(j)', description: 'Consumer care contact details' },
];

export const HowItWorksPage = () => {
  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How LabelGuard AI Works
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            A transparent pipeline from image upload to compliance report.
            <span className="text-teal-400"> AI reads, rules decide.</span>
          </p>
        </motion.div>

        {/* Pipeline Steps */}
        <div className="space-y-8 mb-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`flex items-center gap-6 ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}
            >
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center flex-shrink-0`}>
                <step.icon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-teal-400">STEP {i + 1}</span>
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Verdicts Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Understanding Verdicts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {verdicts.map((v, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`p-6 rounded-2xl ${v.bg} border ${v.border}`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <v.icon className={`w-6 h-6 ${v.color}`} />
                  <span className={`text-xl font-bold ${v.color}`}>{v.status}</span>
                </div>
                <p className="text-gray-400 text-sm">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Rules Reference */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-white text-center mb-8">
            Legal Metrology Rules Reference
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Required Field</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Rule Citation</th>
                  <th className="text-left py-4 px-4 text-gray-400 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 text-white font-medium">{rule.field}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 rounded bg-teal-500/10 text-teal-400 text-xs font-mono">
                        {rule.rule}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-gray-400 text-sm">{rule.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Key Principle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-2xl bg-gradient-to-br from-teal-500/10 to-cyan-500/5 border border-teal-500/20 text-center"
        >
          <Scale className="w-12 h-12 text-teal-400 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-4">
            Key Principle: AI Reads, Rules Decide
          </h3>
          <p className="text-gray-400 max-w-2xl mx-auto">
            The LLM/AI is used <strong className="text-white">only</strong> to read text and extract fields.
            The <strong className="text-teal-400">compliance decision always comes from deterministic rules</strong>,
            making the system transparent, defensible, and auditable.
          </p>
        </motion.div>
      </div>
    </div>
  );
};
