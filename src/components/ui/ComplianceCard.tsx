import { motion } from 'framer-motion';
import { StatusBadge } from './StatusBadge';
import { ConfidenceBar } from './ConfidenceBar';
import type { ComplianceCheck } from '../../context/LabelGuardContext';

const FIELD_LABELS: Record<string, string> = {
  product_name: 'Product Name',
  manufacturer: 'Manufacturer',
  manufacturer_address: 'Manufacturer Address',
  net_quantity: 'Net Quantity',
  mrp: 'MRP',
  country_of_origin: 'Country of Origin',
  manufacturing_date: 'Manufacturing Date',
  best_before: 'Best Before',
  consumer_care: 'Consumer Care',
  unit_sale_price: 'Unit Sale Price',
};

interface ComplianceCardProps {
  check: ComplianceCheck;
  index: number;
}

export const ComplianceCard = ({ check, index }: ComplianceCardProps) => {
  const isPass = check.status === 'PASS';
  const isFail = check.status === 'FAIL';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-lg ${
        isPass
          ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40'
          : isFail
          ? 'bg-red-500/5 border-red-500/20 hover:border-red-500/40'
          : 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="text-white font-medium">
              {FIELD_LABELS[check.field] || check.field}
            </h4>
            <StatusBadge status={check.status} size="sm" />
          </div>

          {check.value && (
            <p className="text-gray-400 text-sm mb-2 truncate" title={check.value}>
              {check.value}
            </p>
          )}

          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs text-gray-500">OCR Confidence:</span>
            <ConfidenceBar confidence={check.confidence} className="flex-1 max-w-[150px]" />
          </div>

          {/* Law violated / basis */}
          {(check.law || check.rule_citation) && (
            <div className="mb-2">
              <div className="text-xs text-gray-500">
                <span className="text-gray-600 uppercase tracking-wide">Legal Basis:</span>{' '}
                <span className="text-cyan-400">{check.law || check.rule_citation}</span>
              </div>
              {check.requirement && (
                <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                  <span className="text-gray-600 uppercase tracking-wide">Requirement:</span>{' '}
                  {check.requirement}
                </div>
              )}
            </div>
          )}

          {/* Explicit why / reason */}
          {check.reason && (
            <p
              className={`text-sm leading-relaxed ${
                isPass ? 'text-emerald-300/90' : isFail ? 'text-red-300/90' : 'text-amber-300/90'
              }`}
            >
              {check.reason}
            </p>
          )}

          {/* Violation callout only when it actually fails */}
          {isFail && check.violation && (
            <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-xs text-red-200 leading-relaxed">
                <span className="font-semibold text-red-300 uppercase tracking-wide">⚠ Non-Compliant: </span>
                {check.violation}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-2">
            <span className="text-gray-600">Source:</span> {check.explanation}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
