import { useEffect, useRef, useState } from 'react';

interface VideoBackgroundProps {
  variant?: 'aurora' | 'particles' | 'waves' | 'mesh';
}

export const VideoBackground = ({ variant = 'aurora' }: VideoBackgroundProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Aurora color palette
    const auroraColors = [
      { r: 20, g: 184, b: 166, a: 0.3 },   // Teal
      { r: 6, g: 182, b: 212, a: 0.25 },   // Cyan
      { r: 99, g: 102, b: 241, a: 0.2 },   // Indigo
      { r: 139, g: 92, b: 246, a: 0.15 },  // Purple
    ];

    const drawAurora = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw flowing aurora bands
      auroraColors.forEach((color, i) => {
        const yOffset = canvas.height * (0.1 + i * 0.15);
        const amplitude = 50 + i * 30;
        const frequency = 0.002 - i * 0.0003;
        const speed = time * (0.3 + i * 0.1);

        ctx.beginPath();
        ctx.moveTo(0, yOffset);

        // Create smooth wave path
        for (let x = 0; x <= canvas.width; x += 2) {
          const y = yOffset + 
            Math.sin(x * frequency + speed) * amplitude +
            Math.sin(x * frequency * 2.5 + speed * 1.3) * (amplitude * 0.4) +
            Math.sin(x * frequency * 0.5 + speed * 0.7) * (amplitude * 0.6);
          ctx.lineTo(x, y);
        }

        // Complete the path
        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        // Create gradient fill
        const gradient = ctx.createLinearGradient(0, yOffset - amplitude, 0, yOffset + amplitude * 2);
        gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`);
        gradient.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Add shimmer particles
      const particleCount = 50;
      for (let i = 0; i < particleCount; i++) {
        const x = (Math.sin(time * 0.5 + i * 0.5) + 1) / 2 * canvas.width;
        const y = (Math.cos(time * 0.3 + i * 0.7) + 1) / 2 * canvas.height;
        const size = 1 + Math.sin(time + i) * 0.5;
        const alpha = 0.1 + Math.sin(time * 2 + i) * 0.05;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      }

      // Add glow spots
      const glowCount = 3;
      for (let i = 0; i < glowCount; i++) {
        const x = canvas.width * (0.2 + i * 0.3) + Math.sin(time * 0.5 + i * 2) * 100;
        const y = canvas.height * 0.3 + Math.cos(time * 0.3 + i) * 50;
        const radius = 100 + Math.sin(time + i) * 30;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, `rgba(20, 184, 166, 0.1)`);
        gradient.addColorStop(0.5, `rgba(6, 182, 212, 0.05)`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particleCount = 100;
      for (let i = 0; i < particleCount; i++) {
        const seed = i * 137.5;
        const x = ((seed * 1.1) % canvas.width);
        const y = ((seed * 0.7) % canvas.height);
        const size = 1 + (seed % 2);
        const alpha = 0.05 + Math.sin(time * 2 + i * 0.1) * 0.03;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 3);
        gradient.addColorStop(0, `rgba(20, 184, 166, ${alpha})`);
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      // Draw connecting lines
      ctx.strokeStyle = 'rgba(20, 184, 166, 0.02)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 20; i++) {
        const x1 = (Math.sin(time * 0.5 + i) + 1) / 2 * canvas.width;
        const y1 = (Math.cos(time * 0.3 + i) + 1) / 2 * canvas.height;
        const x2 = (Math.sin(time * 0.5 + i + 1) + 1) / 2 * canvas.width;
        const y2 = (Math.cos(time * 0.3 + i + 1) + 1) / 2 * canvas.height;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    };

    const drawWaves = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const waveCount = 5;
      for (let w = 0; w < waveCount; w++) {
        const baseY = canvas.height * (0.3 + w * 0.12);
        const amplitude = 30 + w * 15;
        const frequency = 0.003 + w * 0.001;
        const speed = time * (0.5 + w * 0.15);
        const alpha = 0.03 + w * 0.01;

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= canvas.width; x += 3) {
          const y = baseY + 
            Math.sin(x * frequency + speed) * amplitude +
            Math.sin(x * frequency * 2 + speed * 1.5) * (amplitude * 0.3);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, canvas.height);
        gradient.addColorStop(0, `rgba(20, 184, 166, ${alpha})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const drawMesh = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const gridSize = 60;
      const cols = Math.ceil(canvas.width / gridSize) + 1;
      const rows = Math.ceil(canvas.height / gridSize) + 1;

      // Draw grid points
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const baseX = i * gridSize;
          const baseY = j * gridSize;
          
          const offsetX = Math.sin(time * 0.5 + i * 0.2 + j * 0.1) * 10;
          const offsetY = Math.cos(time * 0.5 + j * 0.2 + i * 0.1) * 10;
          
          const x = baseX + offsetX;
          const y = baseY + offsetY;
          
          const distFromCenter = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + 
            Math.pow(y - canvas.height / 2, 2)
          );
          const maxDist = Math.sqrt(
            Math.pow(canvas.width / 2, 2) + 
            Math.pow(canvas.height / 2, 2)
          );
          const alpha = 0.15 - (distFromCenter / maxDist) * 0.1;

          ctx.beginPath();
          ctx.arc(x, y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(20, 184, 166, ${alpha})`;
          ctx.fill();

          // Draw connections
          if (i < cols - 1) {
            const nextX = (i + 1) * gridSize + Math.sin(time * 0.5 + (i + 1) * 0.2 + j * 0.1) * 10;
            const nextY = baseY + Math.cos(time * 0.5 + j * 0.2 + (i + 1) * 0.1) * 10;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nextX, nextY);
            ctx.strokeStyle = `rgba(20, 184, 166, ${alpha * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }

          if (j < rows - 1) {
            const nextX = baseX + Math.sin(time * 0.5 + i * 0.2 + (j + 1) * 0.1) * 10;
            const nextY = (j + 1) * gridSize + Math.cos(time * 0.5 + (j + 1) * 0.2 + i * 0.1) * 10;
            
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(nextX, nextY);
            ctx.strokeStyle = `rgba(20, 184, 166, ${alpha * 0.3})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      time += 0.016;

      switch (variant) {
        case 'aurora':
          drawAurora();
          break;
        case 'particles':
          drawParticles();
          break;
        case 'waves':
          drawWaves();
          break;
        case 'mesh':
          drawMesh();
          break;
        default:
          drawAurora();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [isReducedMotion, variant]);

  if (isReducedMotion) {
    return (
      <div className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050510]" />
    );
  }

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ 
          background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050510 100%)',
        }}
      />
      {/* Overlay for better readability */}
      <div className="fixed inset-0 pointer-events-none z-[1] bg-gradient-to-b from-transparent via-transparent to-[#050505]/50" />
    </>
  );
};
