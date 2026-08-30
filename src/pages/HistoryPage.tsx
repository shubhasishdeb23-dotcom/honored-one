import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Trash2, Eye, Calendar, Shield, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useLabelGuard } from '../context/LabelGuardContext';
import { ScoreGauge } from '../components/ui/ScoreGauge';

export const HistoryPage = () => {
  const { scanHistory, deleteScan } = useLabelGuard();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return scanHistory;
    const query = searchQuery.toLowerCase();
    return scanHistory.filter(scan => 
      scan.product.product_name?.toLowerCase().includes(query) ||
      scan.product.manufacturer?.toLowerCase().includes(query)
    );
  }, [scanHistory, searchQuery]);

  const avgScore = scanHistory.length > 0
    ? Math.round(scanHistory.reduce((acc, s) => acc + s.compliance.score, 0) / scanHistory.length)
    : 0;

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'LOW': return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'MEDIUM': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default: return <ShieldAlert className="w-4 h-4 text-red-400" />;
    }
  };

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Scan History
          </h1>
          <p className="text-gray-400 text-lg">
            View and manage your previous compliance scans
          </p>
        </motion.div>

        {/* Stats Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-white">{scanHistory.length}</div>
            <div className="text-xs text-gray-500">Total Scans</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
              {avgScore}
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-emerald-400">
              {scanHistory.filter(s => s.compliance.risk_level === 'LOW').length}
            </div>
            <div className="text-xs text-gray-500">Low Risk</div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-center">
            <div className="text-2xl font-bold text-red-400">
              {scanHistory.filter(s => s.compliance.risk_level === 'HIGH').length}
            </div>
            <div className="text-xs text-gray-500">High Risk</div>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by product name or manufacturer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/[0.02] border border-white/10 text-white placeholder:text-gray-600 focus:border-teal-500/50 focus:outline-none transition-colors"
            />
          </div>
        </motion.div>

        {/* History List */}
        <div className="space-y-4">
          <AnimatePresence>
            {filteredHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-600" />
                </div>
                <p className="text-gray-500">
                  {searchQuery ? 'No matching scans found' : 'No scans yet. Start by scanning a product!'}
                </p>
                <Link
                  to="/scan"
                  className="inline-block mt-4 px-6 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
                >
                  Start Scanning
                </Link>
              </motion.div>
            ) : (
              filteredHistory.map((scan, index) => (
                <motion.div
                  key={scan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-6 p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors group"
                >
                  {/* Thumbnail */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                    <img
                      src={scan.image_path}
                      alt="Product"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {scan.product.product_name || 'Unknown Product'}
                    </h3>
                    <p className="text-gray-500 text-sm truncate">
                      {scan.product.manufacturer || 'Unknown Manufacturer'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(scan.timestamp).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        {getRiskIcon(scan.compliance.risk_level)}
                        <span className={
                          scan.compliance.risk_level === 'LOW' ? 'text-emerald-400' :
                          scan.compliance.risk_level === 'MEDIUM' ? 'text-amber-400' :
                          'text-red-400'
                        }>
                          {scan.compliance.risk_level} Risk
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 relative">
                      <svg className="transform -rotate-90" width="64" height="64">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                        <circle
                          cx="32"
                          cy="32"
                          r="28"
                          fill="none"
                          stroke={scan.compliance.score >= 80 ? '#10b981' : scan.compliance.score >= 50 ? '#f59e0b' : '#ef4444'}
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${(scan.compliance.score / 100) * 176} 176`}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{scan.compliance.score}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/scan`}
                      className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </Link>
                    <button
                      onClick={() => deleteScan(scan.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
