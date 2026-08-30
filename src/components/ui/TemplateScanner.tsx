import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, X, Check, ArrowRight } from 'lucide-react';

interface TemplateScannerProps {
  onSelect: (template: TemplateType) => void;
  onClose: () => void;
}

export type TemplateType = 'food' | 'beverage' | 'cosmetic' | 'pharma' | 'electronics' | 'custom';

interface Template {
  id: TemplateType;
  name: string;
  description: string;
  icon: string;
  color: string;
  requiredFields: string[];
}

const templates: Template[] = [
  {
    id: 'food',
    name: 'Food Products',
    description: 'Packaged foods, snacks, beverages',
    icon: '🍔',
    color: 'from-orange-500 to-amber-500',
    requiredFields: ['product_name', 'manufacturer', 'net_quantity', 'mrp', 'manufacturing_date', 'best_before', 'ingredients', 'nutritional_info', 'fssai_license', 'country_of_origin'],
  },
  {
    id: 'beverage',
    name: 'Beverages',
    description: 'Drinks, juices, water',
    icon: '🥤',
    color: 'from-blue-500 to-cyan-500',
    requiredFields: ['product_name', 'manufacturer', 'net_quantity', 'mrp', 'manufacturing_date', 'best_before', 'fssai_license', 'country_of_origin'],
  },
  {
    id: 'cosmetic',
    name: 'Cosmetics',
    description: 'Skincare, makeup, personal care',
    icon: '💄',
    color: 'from-pink-500 to-rose-500',
    requiredFields: ['product_name', 'manufacturer', 'net_quantity', 'mrp', 'manufacturing_date', 'batch_number', 'ingredients', 'country_of_origin'],
  },
  {
    id: 'pharma',
    name: 'Pharmaceuticals',
    description: 'Medicines, supplements',
    icon: '💊',
    color: 'from-green-500 to-emerald-500',
    requiredFields: ['product_name', 'manufacturer', 'net_quantity', 'mrp', 'manufacturing_date', 'expiry_date', 'batch_number', 'schedule', 'dosage', 'storage_conditions'],
  },
  {
    id: 'electronics',
    name: 'Electronics',
    description: 'Gadgets, appliances',
    icon: '📱',
    color: 'from-purple-500 to-violet-500',
    requiredFields: ['product_name', 'manufacturer', 'model_number', 'mrp', 'warranty', 'serial_number', 'country_of_origin', 'power_rating', 'customer_care'],
  },
  {
    id: 'custom',
    name: 'Custom Template',
    description: 'Define your own fields',
    icon: '⚙️',
    color: 'from-gray-500 to-slate-500',
    requiredFields: [],
  },
];

export const TemplateScanner = ({ onSelect, onClose }: TemplateScannerProps) => {
  const [selected, setSelected] = useState<TemplateType | null>(null);

  const handleSelect = () => {
    if (selected) {
      onSelect(selected);
      onClose();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] rounded-3xl border border-white/10 p-6"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Product Templates</h2>
            <p className="text-gray-400 text-sm">Choose a product category for specialized scanning</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {templates.map((template) => (
            <motion.button
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelected(template.id)}
              className={`relative p-4 rounded-xl border transition-all ${
                selected === template.id
                  ? 'bg-white/10 border-teal-500/50'
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20'
              }`}
            >
              {selected === template.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center text-2xl mb-3`}>
                {template.icon}
              </div>
              <h3 className="text-white font-medium mb-1">{template.name}</h3>
              <p className="text-gray-500 text-xs">{template.description}</p>
              
              {template.requiredFields.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {template.requiredFields.slice(0, 3).map((field, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px]">
                      {field.replace(/_/g, ' ')}
                    </span>
                  ))}
                  {template.requiredFields.length > 3 && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-400 text-[10px]">
                      +{template.requiredFields.length - 3} more
                    </span>
                  )}
                </div>
              )}
            </motion.button>
          ))}
        </div>

        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={handleSelect}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all"
            >
              Use This Template
              <ArrowRight size={20} />
            </button>
          </motion.div>
        )}

        <div className="mt-6 p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <p className="text-gray-400 text-xs">
            <strong className="text-white">Note:</strong> Templates help optimize field detection for specific product categories. The scanner will prioritize the most relevant fields for that category.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
