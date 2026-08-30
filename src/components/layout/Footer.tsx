import { Shield, Heart, AlertTriangle } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="relative z-20 mt-20 border-t border-white/5 bg-black/20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-white font-semibold">LabelGuard AI</span>
              <span className="text-gray-500 text-xs block">SIH26034 - Smart India Hackathon 2026</span>
            </div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>AI-Assisted Assessment - Final determination rests with authorized officer</span>
            </div>
          </div>

          <div className="text-right">
            <p className="text-gray-500 text-sm flex items-center justify-end gap-2">
              Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for SIH 2026
            </p>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-gray-600 text-xs">
            © {new Date().getFullYear()} LabelGuard AI - Packaged Commodity Compliance Scanner
          </p>
        </div>
      </div>
    </footer>
  );
};
