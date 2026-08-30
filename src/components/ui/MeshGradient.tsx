import { useEffect, useRef } from 'react';

interface MeshGradientProps {
  className?: string;
}

export const MeshGradient = ({ className = '' }: MeshGradientProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create animated mesh gradient layers
    const layers = [
      { color: 'from-teal-500/20', delay: 0 },
      { color: 'from-cyan-500/15', delay: 2 },
      { color: 'from-indigo-500/10', delay: 4 },
      { color: 'from-purple-500/15', delay: 6 },
    ];

    layers.forEach((layer, i) => {
      const div = document.createElement('div');
      div.className = `absolute inset-0 bg-gradient-to-br ${layer.color} to-transparent opacity-0 transition-opacity duration-[3000ms]`;
      div.style.animationDelay = `${layer.delay}s`;
      container.appendChild(div);

      // Animate opacity
      setTimeout(() => {
        div.style.opacity = '1';
      }, 100 + layer.delay * 1000);
    });

    return () => {
      layers.forEach((_, i) => {
        const child = container.children[i];
        if (child) container.removeChild(child);
      });
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className={`absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-teal-900/10 via-transparent to-indigo-900/10" />
      
      {/* Animated orbs */}
      <div className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full bg-teal-500/5 blur-[150px] animate-[float_20s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/4 -right-1/4 w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px] animate-[float_25s_ease-in-out_infinite_reverse]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-cyan-500/3 blur-[200px] animate-[float_30s_ease-in-out_infinite]" />
      
      {/* Shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent animate-[shimmer_8s_ease-in-out_infinite]" />
    </div>
  );
};
