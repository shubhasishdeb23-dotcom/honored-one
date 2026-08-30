import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Gauge,
  FileWarning, ScanLine, TrendingUp, Type,
} from 'lucide-react';
import { useLabelGuard } from '../context/LabelGuardContext';

const FIELD_LABELS: Record<string, string> = {
  product_name: 'Product Name',
  manufacturer: 'Manufacturer',
  manufacturer_address: 'Manufacturer Address',
  net_quantity: 'Net Quantity',
  mrp: 'MRP',
  country_of_origin: 'Country of Origin',
  manufacturing_date: 'Manufacturing Date',
  best_before: 'Best Before / Expiry',
  consumer_care: 'Consumer Care Contact',
  unit_sale_price: 'Unit Sale Price',
};

const riskColor = (level: string) =>
  level === 'LOW' ? 'text-emerald-400' : level === 'MEDIUM' ? 'text-amber-400' : 'text-red-400';

const riskBadge = (level: string) =>
  level === 'LOW' ? 'bg-emerald-500/15 text-emerald-400'
  : level === 'MEDIUM' ? 'bg-amber-500/15 text-amber-400'
  : 'bg-red-500/15 text-red-400';

export const EnforcementDashboard = () => {
  const { scanHistory } = useLabelGuard();

  const stats = useMemo(() => {
    const total = scanHistory.length;
    const totalChecks = scanHistory.reduce((acc, s) => acc + (s.compliance.checks?.length || 0), 0);
    const passedChecks = scanHistory.reduce(
      (acc, s) => acc + (s.compliance.checks?.filter(c => c.status === 'PASS').length || 0),
      0,
    );
    const failChecks = scanHistory.reduce(
      (acc, s) => acc + (s.compliance.checks?.filter(c => c.status === 'FAIL').length || 0),
      0,
    );
    const reviewChecks = scanHistory.reduce(
      (acc, s) => acc + (s.compliance.checks?.filter(c => c.status === 'REVIEW').length || 0),
      0,
    );
    const avgScore = total > 0
      ? Math.round(scanHistory.reduce((acc, s) => acc + s.compliance.score, 0) / total)
      : 0;
    const low = scanHistory.filter(s => s.compliance.risk_level === 'LOW').length;
    const medium = scanHistory.filter(s => s.compliance.risk_level === 'MEDIUM').length;
    const high = scanHistory.filter(s => s.compliance.risk_level === 'HIGH').length;

    // Most failed / review-flagged fields
    const fieldCounts: Record<string, { fail: number; review: number; total: number }> = {};
    scanHistory.forEach(s => {
      (s.compliance.checks || []).forEach(c => {
        const e = fieldCounts[c.field] || { fail: 0, review: 0, total: 0 };
        e.total += 1;
        if (c.status === 'FAIL') e.fail += 1;
        if (c.status === 'REVIEW') e.review += 1;
        fieldCounts[c.field] = e;
      });
    });
    const worstFields = Object.entries(fieldCounts)
      .map(([field, v]) => ({ field, ...v, issues: v.fail + v.review }))
      .filter(v => v.issues > 0)
      .sort((a, b) => b.issues - a.issues)
      .slice(0, 5);

    // Readability analytics
    let readPass = 0, readReview = 0, readNoText = 0, readScans = 0;
    scanHistory.forEach(s => {
      if (!s.readability) return;
      readScans += 1;
      if (s.readability.status === 'PASS') readPass += 1;
      else if (s.readability.status === 'FAIL') readNoText += 1;
      else readReview += 1;
    });

    const needsAttention = scanHistory
      .filter(s => s.compliance.risk_level === 'HIGH' || s.compliance.risk_level === 'MEDIUM')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);

    return {
      total, totalChecks, passedChecks, failChecks, reviewChecks, avgScore,
      low, medium, high, worstFields, readPass, readReview, readNoText, readScans,
      needsAttention,
    };
  }, [scanHistory]);

  const passRate = stats.totalChecks > 0
    ? Math.round((stats.passedChecks / stats.totalChecks) * 100)
    : 0;

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Enforcement Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Aggregated compliance intelligence across all scanned labels
          </p>
        </motion.div>

        {stats.total === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 max-w-md mx-auto rounded-2xl bg-white/[0.02] border border-white/5"
          >
            <ScanLine className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">No scan data yet.</p>
            <p className="text-gray-600 text-sm mb-6">
              Run some compliance scans and this dashboard will surface aggregate
              risk, the most-failed declarations and readability issues for
              monitoring.
            </p>
            <Link
              to="/scan"
              className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
            >
              Start Scanning
            </Link>
          </motion.div>
        ) : (
          <>
            {/* KPI cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <Gauge className="w-6 h-6 text-cyan-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.avgScore}</div>
                <div className="text-xs text-gray-500">Avg Compliance Score</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-emerald-400">{passRate}%</div>
                <div className="text-xs text-gray-500">Declaration Pass Rate</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <FileWarning className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-red-400">{stats.failChecks}</div>
                <div className="text-xs text-gray-500">Non-Compliant Declarations</div>
              </div>
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
                <ScanLine className="w-6 h-6 text-teal-400 mx-auto mb-2" />
                <div className="text-3xl font-bold text-white">{stats.total}</div>
                <div className="text-xs text-gray-500">Labels Scanned</div>
              </div>
            </motion.div>

            {/* Risk distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-8"
            >
              <h3 className="text-lg font-semibold text-white mb-4">Risk Distribution</h3>
              <div className="flex items-end gap-3 h-32">
                {[
                  { label: 'LOW', count: stats.low, color: 'from-emerald-500 to-teal-400' },
                  { label: 'MEDIUM', count: stats.medium, color: 'from-amber-500 to-yellow-400' },
                  { label: 'HIGH', count: stats.high, color: 'from-red-500 to-rose-400' },
                ].map(bar => (
                  <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-sm font-bold text-white">{bar.count}</span>
                    <div className="w-full max-w-[100px] rounded-t-lg bg-gradient-to-t flex items-end justify-center overflow-hidden">
                      <div
                        className={`w-full bg-gradient-to-t ${bar.color}`}
                        style={{ height: `${bar.count ? Math.max(14, (bar.count / Math.max(1, stats.total)) * 100) : 6}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${riskColor(bar.label)}`}>{bar.label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Most-failed fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-white/[0.02] border border-white/5 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Most Flagged Declarations</h3>
                </div>
                {stats.worstFields.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No flagged declarations across scanned labels — good compliance posture.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {stats.worstFields.map(f => {
                      const pct = f.total > 0 ? Math.round((f.issues / f.total) * 100) : 0;
                      return (
                        <div key={f.field}>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-300">{FIELD_LABELS[f.field] || f.field}</span>
                            <span className="text-gray-500">
                              {f.fail} fail · {f.review} review · {pct}%
                            </span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${pct > 50 ? 'bg-red-500' : pct > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* Readability analytics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="rounded-2xl bg-white/[0.02] border border-white/5 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                                  <Type className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Label Readability</h3>
                </div>
                {stats.readScans === 0 ? (
                  <p className="text-gray-500 text-sm">
                    No legibility/font-size analysis recorded yet.
                  </p>
                ) : (
                  <>
                    <div className="flex items-end gap-3 h-32">
                      {[
                        { label: 'Legible', count: stats.readPass, color: 'from-emerald-500 to-teal-400' },
                        { label: 'Review', count: stats.readReview, color: 'from-amber-500 to-yellow-400' },
                        { label: 'No text', count: stats.readNoText, color: 'from-red-500 to-rose-400' },
                      ].map(bar => (
                        <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                          <span className="text-sm font-bold text-white">{bar.count}</span>
                          <div className="w-full max-w-[90px] rounded-t-lg overflow-hidden flex items-end">
                            <div
                              className={`w-full bg-gradient-to-t ${bar.color}`}
                              style={{ height: `${bar.count ? Math.max(14, (bar.count / Math.max(1, stats.readScans)) * 100) : 6}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      Estimated minimum font size detected from OCR line heights and checked
                      against the ~1.5&nbsp;mm legibility guideline.
                    </p>
                  </>
                )}
              </motion.div>
            </div>

            {/* Needs attention */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-semibold text-white">Recent Items Needing Attention</h3>
              </div>
              {stats.needsAttention.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No medium or high-risk items in the latest scans. {stats.total} label(s) scanned.
                </p>
              ) : (
                <div className="space-y-3">
                  {stats.needsAttention.map(scan => (
                    <Link
                      key={scan.id}
                      to="/scan"
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-colors"
                    >
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${scan.compliance.risk_level === 'HIGH' ? 'bg-red-500' : 'bg-amber-500'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {scan.product.product_name || 'Unknown Product'}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {scan.product.manufacturer || 'Unknown manufacturer'} · {new Date(scan.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${riskBadge(scan.compliance.risk_level)}`}>
                        {scan.compliance.risk_level} · {scan.compliance.score}
                      </span>
                      <ShieldAlert className="w-4 h-4 text-gray-600" />
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};
