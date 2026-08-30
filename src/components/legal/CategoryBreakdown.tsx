import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { ReportData } from '../../types/legal';
import { CATEGORY_LABELS, CATEGORY_COLORS } from '../../data/legalDatabase';

interface CategoryBreakdownProps {
  report: ReportData;
}

const COLORS = ['#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#f97316', '#3b82f6', '#a855f7'];

export const CategoryBreakdown = ({ report }: CategoryBreakdownProps) => {
  const data = Object.entries(report.summary.categories)
    .filter(([_, count]) => count > 0)
    .map(([category, count], index) => ({
      name: CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] || category,
      value: count,
      color: COLORS[index % COLORS.length],
    }));

  if (data.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-white/[0.02] border border-white/5 p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-6">Category Breakdown</h3>
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0a0a0a', 
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend 
              formatter={(value) => <span className="text-gray-300 text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};
