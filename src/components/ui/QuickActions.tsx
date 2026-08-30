import { motion } from 'framer-motion';
import { Zap, History, Download, Settings, HelpCircle, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  onClick: () => void;
}

export const QuickActions = () => {
  const [isDark, setIsDark] = useState(true);

  const actions: QuickAction[] = [
    {
      id: 'history',
      label: 'Recent Scans',
      icon: History,
      color: 'from-teal-500 to-cyan-500',
      onClick: () => {},
    },
    {
      id: 'download',
      label: 'Export All',
      icon: Download,
      color: 'from-cyan-500 to-blue-500',
      onClick: () => {},
    },
    {
      id: 'theme',
      label: isDark ? 'Light Mode' : 'Dark Mode',
      icon: isDark ? Sun : Moon,
      color: 'from-blue-500 to-indigo-500',
      onClick: () => setIsDark(!isDark),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'from-indigo-500 to-purple-500',
      onClick: () => {},
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      color: 'from-purple-500 to-pink-500',
      onClick: () => {},
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {actions.map((action, i) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          onClick={action.onClick}
          className="group flex items-center gap-3"
        >
          <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm bg-black/80 px-3 py-1.5 rounded-lg whitespace-nowrap">
            {action.label}
          </span>
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
            <action.icon className="w-5 h-5 text-white" />
          </div>
        </motion.button>
      ))}
    </div>
  );
};
