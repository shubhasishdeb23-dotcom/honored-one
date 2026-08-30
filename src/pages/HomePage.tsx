import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Upload, BarChart3, FileSearch, ArrowRight, Zap, Eye, Scale, CheckCircle2 } from 'lucide-react';

const features = [
  {
    icon: Eye,
    title: 'OCR Text Recognition',
    description: 'Advanced OCR reads product labels with high accuracy, even on curved surfaces.',
    color: 'from-teal-500 to-cyan-500',
  },
  {
    icon: Zap,
    title: 'AI Field Extraction',
    description: 'Intelligent extraction of 10 mandatory fields using local LLM or regex fallback.',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: Scale,
    title: 'Deterministic Rules',
    description: 'Compliance decisions from a rule engine, not AI - defensible and transparent.',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: CheckCircle2,
    title: 'PASS/FAIL/REVIEW',
    description: 'Clear verdicts with REVIEW state for low-confidence items - never guess.',
    color: 'from-indigo-500 to-purple-500',
  },
];

const stats = [
  { value: '10+', label: 'Required Fields Checked' },
  { value: '< 30s', label: 'Average Scan Time' },
  { value: '100%', label: 'Offline Capable' },
  { value: 'FREE', label: 'No Paid Services' },
];

export const HomePage = () => {
  return (
    <div className="relative z-10">
      {/* Hero Section */}
      <section className="min-h-[90vh] flex items-center justify-center px-6 pt-20">
        <div className="max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/20 mb-8"
          >
            <Shield className="w-4 h-4 text-teal-400" />
            <span className="text-sm text-teal-400 font-medium">SIH26034 - Packaged Commodity Compliance Scanner</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 tracking-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-400 to-indigo-500">
              LabelGuard
            </span>
            <span className="text-white"> AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Verify packaged product labels against Indian Legal Metrology Rules.
            <span className="text-white"> AI reads, rules decide.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/scan"
              className="group flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-lg hover:from-teal-400 hover:to-cyan-400 transition-all shadow-lg shadow-teal-500/20"
            >
              <Upload className="w-5 h-5" />
              Start Scanning
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/how-it-works"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/20 text-white font-medium hover:bg-white/5 transition-colors"
            >
              How It Works
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 max-w-2xl mx-auto"
          >
            <p className="text-amber-400 text-sm">
              <strong>AI-Assisted Assessment:</strong> This tool provides preliminary compliance screening. 
              Final legal determination rests with an authorized officer.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5"
              >
                <div className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
                  {stat.value}
                </div>
                <div className="text-gray-500 text-sm mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              How It Works
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A transparent pipeline from image upload to compliance report
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-indigo-500/10 border border-white/10 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-indigo-500/5 blur-3xl" />
            
            <div className="relative z-10 text-center">
              <BarChart3 className="w-12 h-12 text-teal-400 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to verify product labels?
              </h2>
              <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                Upload a product label image and get instant compliance assessment 
                against Indian Legal Metrology Rules.
              </p>
              <Link
                to="/scan"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:from-teal-400 hover:to-cyan-400 transition-all"
              >
                Start Free Scan
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
