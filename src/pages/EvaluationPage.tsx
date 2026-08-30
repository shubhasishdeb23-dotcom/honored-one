import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FlaskConical, RefreshCw, CheckCircle2, AlertTriangle, SearchCheck,
  Target, FileWarning, Database, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

const SCAN_API_URL =
  (import.meta.env?.VITE_SCAN_API_URL as string) || 'http://localhost:8001';

interface Metric {
  name: string;
  precision: number;
  recall: number;
  f1: number;
  accuracy: number;
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  samples: number;
}

interface PerCase {
  id: string;
  kind: 'image' | 'text';
  flagged: string[];
  expected_missing: string[];
  field_results: Record<string, 'TP' | 'FP' | 'FN' | 'TN'>;
  compliance: { score: number; risk_level: string; note: string };
}

interface EvalReport {
  dataset: {
    image_cases: string[];
    text_cases: string[];
    total_cases: number;
    llm_mode: string;
  };
  per_field: Metric[];
  field_breakdown: Record<string, { TP: string[]; FP: string[]; FN: string[]; TN: string[] }>;
  overall_extraction: Metric;
  compliance_fail: Metric;
  compliance_flags: Metric;
  per_case: PerCase[];
  scores: { id: string; score: number; risk: string; kind: string }[];
}

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

const pct = (n: number) => `${Math.round(n * 100)}%`;

const metricColor = (value: number) =>
  value >= 0.9 ? 'text-emerald-400' : value >= 0.7 ? 'text-amber-400' : 'text-red-400';

const KpiCard = ({
  icon, value, label, tone,
}: {
  icon: React.ReactNode; value: string; label: string; tone: string;
}) => (
  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
    <div className={`w-6 h-6 mx-auto mb-2 ${tone}`}>{icon}</div>
    <div className="text-3xl font-bold text-white">{value}</div>
    <div className="text-xs text-gray-500">{label}</div>
  </div>
);

export const EvaluationPage = () => {
  const [report, setReport] = useState<EvalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaseDetails, setShowCaseDetails] = useState(false);
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const run = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${SCAN_API_URL}/api/evaluate?norules=true`, { signal: AbortSignal.timeout(300000) });
      if (!res.ok) throw new Error(`Evaluate API error: ${res.status}`);
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  const ext = report?.overall_extraction;
  const vf = report?.compliance_fail;
  const anyF = report?.compliance_flags;

  return (
    <div className="relative z-10 min-h-screen pt-24 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Accuracy Evaluation
          </h1>
          <p className="text-gray-400 text-lg">
            Blind-sample test of the real OCR → extraction → compliance pipeline
          </p>
          {report && (
            <p className="text-xs text-gray-600 mt-3">
              {report.dataset.total_cases} labeled cases
              ({report.dataset.image_cases.length} image · {report.dataset.text_cases.length} text)
              {report.dataset.llm_mode === 'on' ? ' · LLM explainer on' : ' · rule engine only'}
            </p>
          )}
        </motion.div>

        {loading && (
          <div className="text-center py-24">
            <Loader2 className="w-10 h-10 text-cyan-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-400">
              Re-running OCR over the sample dataset — this takes tens of seconds…
            </p>
          </div>
        )}

        {error && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24 max-w-md mx-auto rounded-2xl bg-white/[0.02] border border-white/5"
          >
            <FileWarning className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-400 mb-2">Could not load the evaluation report.</p>
            <p className="text-gray-600 text-sm mb-6 break-words">{error}</p>
            <button
              onClick={run}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-medium hover:from-teal-400 hover:to-cyan-400 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> Run Again
            </button>
          </motion.div>
        )}

        {!loading && !error && report && (
          <>
            {/* KPIs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
            >
              <KpiCard
                icon={<SearchCheck className="w-6 h-6" />}
                value={ext ? `${Math.round(ext.f1 * 100)}%` : '—'}
                label="Extraction F1"
                tone="text-cyan-400"
              />
              <KpiCard
                icon={<CheckCircle2 className="w-6 h-6" />}
                value={ext ? pct(ext.accuracy) : '—'}
                label="Extraction Accuracy"
                tone="text-emerald-400"
              />
              <KpiCard
                icon={<AlertTriangle className="w-6 h-6" />}
                value={vf ? `${Math.round(vf.recall * 100)}%` : '—'}
                label="Violation Recall (FAIL)"
                tone="text-amber-400"
              />
              <KpiCard
                icon={<Database className="w-6 h-6" />}
                value={`${report.dataset.total_cases}`}
                label="Labeled Cases"
                tone="text-teal-400"
              />
            </motion.div>

            {/* Overall + compliance metrics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid md:grid-cols-3 gap-4 mb-8"
            >
              {[ext && { ...ext, title: 'Overall Extraction', icon: <SearchCheck className="w-5 h-5 text-cyan-400" /> },
                vf && { ...vf, title: 'Violation Detection (FAIL)', icon: <AlertTriangle className="w-5 h-5 text-amber-400" /> },
                anyF && { ...anyF, title: 'Any Flag (FAIL / REVIEW)', icon: <FileWarning className="w-5 h-5 text-rose-400" /> },
              ].filter(Boolean).map((m: any) => (
                <div key={m.title} className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
                  <div className="flex items-center gap-2 mb-4">
                    {m.icon}
                    <h3 className="text-base font-semibold text-white">{m.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {[
                      ['Precision', m.precision, metricColor(m.precision)],
                      ['Recall', m.recall, metricColor(m.recall)],
                      ['F1', m.f1, metricColor(m.f1)],
                      ['Accuracy', m.accuracy, metricColor(m.accuracy)],
                    ].map(([label, v, tone]) => (
                      <div key={label as string}>
                        <div className="text-gray-500 text-xs">{label}</div>
                        <div className={`text-xl font-bold ${tone as string}`}>{pct(v as number)}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 text-[11px] text-gray-600">
                    TP {m.tp} · FP {m.fp} · FN {m.fn} · TN {m.tn} (n={m.samples})
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Per-field extraction */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-5 h-5 text-teal-400" />
                <h3 className="text-lg font-semibold text-white">Per-Field Extraction Accuracy</h3>
              </div>
              <div className="space-y-3">
                {report.per_field.map(f => {
                  const best = Math.max(f.precision, f.recall, f.f1);
                  const color = best >= 0.9 ? 'from-emerald-500 to-teal-400'
                    : best >= 0.7 ? 'from-amber-500 to-yellow-400' : 'from-red-500 to-rose-400';
                  return (
                    <div key={f.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300">{FIELD_LABELS[f.name] || f.name}</span>
                        <span className="text-gray-500">
                          <span className="font-semibold text-gray-300">{pct(f.f1)}</span>
                          {' '}F1 · P {pct(f.precision)} · R {pct(f.recall)}
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${color}`}
                          style={{ width: `${Math.round(f.f1 * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Where accuracy drops — per-field confusion */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-8"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileWarning className="w-5 h-5 text-rose-400" />
                <h3 className="text-lg font-semibold text-white">Where Accuracy Drops</h3>
              </div>
              <p className="text-gray-500 text-sm mb-5">
                TP/FP/FN/TN for each field, with the exact cases that mis-fired —
                expand a field to see which labels it failed on.
              </p>

              <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] gap-2 px-3 pb-2 text-[11px] uppercase tracking-wider text-gray-500">
                <span>Field</span>
                <span className="text-center">TP</span>
                <span className="text-center">FP</span>
                <span className="text-center">FN</span>
                <span className="text-center">TN</span>
                <span className="text-center">F1</span>
              </div>

              <div className="space-y-2">
                {report.per_field.map(f => {
                  const b = report.field_breakdown[f.name];
                  const isOpen = expandedField === f.name;
                  const errors = [...(b?.FP || []), ...(b?.FN || [])];
                  return (
                    <div
                      key={f.name}
                      className={`rounded-xl border transition-colors ${
                        isOpen ? 'border-white/10 bg-white/[0.04]' : 'border-white/5 bg-white/[0.02]'
                      }`}
                    >
                      <button
                        onClick={() => setExpandedField(isOpen ? null : f.name)}
                        className="w-full grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_1fr] items-center gap-2 px-3 py-3 text-left"
                      >
                        <span className="flex items-center gap-2 text-gray-200 text-sm font-medium">
                          {errors.length > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
                          )}
                          {FIELD_LABELS[f.name] || f.name}
                          {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-500" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-500" />}
                        </span>
                        <span className="text-center text-emerald-400 tabular-nums">{b?.TP?.length ?? f.tp}</span>
                        <span className={`text-center tabular-nums ${(b?.FP?.length ?? 0) > 0 ? 'text-amber-400' : 'text-gray-600'}`}>{b?.FP?.length ?? f.fp}</span>
                        <span className={`text-center tabular-nums ${(b?.FN?.length ?? 0) > 0 ? 'text-red-400' : 'text-gray-600'}`}>{b?.FN?.length ?? f.fn}</span>
                        <span className="text-center text-gray-500 tabular-nums">{b?.TN?.length ?? f.tn}</span>
                        <span className="text-center font-semibold tabular-nums">{pct(f.f1)}</span>
                      </button>

                      {isOpen && (
                        <div className="px-4 pb-4 pt-1 space-y-3">
                          {/* FP / TN legend helpers */}
                          {errors.length === 0 ? (
                            <p className="text-xs text-emerald-400">
                              No extraction errors — perfect on this field.
                            </p>
                          ) : (
                            <div className="grid sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1.5">Mis-extracted (FN — missed / FP — wrong add)</div>
                                <div className="flex flex-wrap gap-1.5">
                                  {errors.map(cid => {
                                    const pc = report.per_case.find(c => c.id === cid);
                                    return (
                                      <span key={cid} className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-gray-300">
                                        {cid}
                                        <span className="text-gray-600 ml-1">
                                          ({pc?.kind === 'image' ? 'img' : 'text'})
                                        </span>
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-gray-500 mb-1.5">Correctly absent (TN)</div>
                                <span className="text-[11px] text-gray-600">
                                  {(b?.TN?.length ?? f.tn)} case(s) — value correctly not present
                                </span>
                              </div>
                            </div>
                          )}
                          <div className="text-[11px] text-gray-600">
                            Prec {pct(f.precision)} · Rec {pct(f.recall)} · Acc {pct(f.accuracy)} — sample n={f.samples}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Per-case scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Per-Case Results</h3>
                </div>
                <button
                  onClick={() => setShowCaseDetails(v => !v)}
                  className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  {showCaseDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showCaseDetails ? 'Hide flagged fields' : 'Show flagged fields'}
                </button>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {report.scores.map(s => {
                  const pc = report.per_case.find(c => c.id === s.id);
                  const flagged = pc?.flagged || [];
                  return (
                    <div
                      key={s.id}
                      className="p-4 rounded-xl bg-white/[0.02] border border-white/5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white truncate">{s.id}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${s.kind === 'image' ? 'bg-white/10 text-gray-300' : 'bg-indigo-500/15 text-indigo-300'}`}>
                          {s.kind}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${riskColor(s.risk)}`}>{s.score}</span>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${riskBadge(s.risk)}`}>
                          {s.risk}
                        </span>
                      </div>
                      {showCaseDetails && (
                        <div className="mt-3 text-xs text-gray-500">
                          <div>
                            Flagged:{' '}
                            {flagged.length === 0
                              ? <span className="text-emerald-400">none</span>
                              : flagged.map(f => FIELD_LABELS[f] || f).join(', ')}
                          </div>
                          {pc && pc.expected_missing.length > 0 && (
                            <div className="mt-1">
                              Missing expected: {pc.expected_missing.map(f => FIELD_LABELS[f] || f).join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};
