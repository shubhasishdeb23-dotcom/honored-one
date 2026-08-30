import { useEffect, useRef } from 'react';

export const AnimatedBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const particles: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      color: string;
      alpha: number;
      phase: number;
    }> = [];

    const colors = ['#14b8a6', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const createParticles = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 2 + 0.5,
          color: colors[Math.floor(Math.random() * colors.length)],
          alpha: Math.random() * 0.3 + 0.1,
          phase: Math.random() * Math.PI * 2,
        });
      }
    };

    const drawAurora = () => {
      // Draw flowing aurora bands
      const bandCount = 4;
      for (let b = 0; b < bandCount; b++) {
        const baseY = canvas.height * (0.15 + b * 0.2);
        const amplitude = 40 + b * 20;
        const frequency = 0.002 - b * 0.0003;
        const speed = time * (0.2 + b * 0.1);

        ctx.beginPath();
        ctx.moveTo(0, baseY);

        for (let x = 0; x <= canvas.width; x += 3) {
          const y = baseY + 
            Math.sin(x * frequency + speed) * amplitude +
            Math.sin(x * frequency * 2.5 + speed * 1.3) * (amplitude * 0.4) +
            Math.sin(x * frequency * 0.5 + speed * 0.7) * (amplitude * 0.6);
          ctx.lineTo(x, y);
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();

        const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, baseY + amplitude * 2);
        const alpha = 0.08 - b * 0.015;
        gradient.addColorStop(0, `rgba(20, 184, 166, ${alpha})`);
        gradient.addColorStop(0.5, `rgba(6, 182, 212, ${alpha * 0.5})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const drawParticles = () => {
      particles.forEach((p) => {
        // Organic movement
        const waveX = Math.sin(time * 0.5 + p.phase) * 0.5;
        const waveY = Math.cos(time * 0.3 + p.phase) * 0.5;
        
        p.x += p.vx + waveX;
        p.y += p.vy + waveY;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Pulsing alpha
        const pulseAlpha = p.alpha + Math.sin(time * 2 + p.phase) * 0.1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = pulseAlpha;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    };

    const drawConnections = () => {
      ctx.lineWidth = 0.5;
      
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = (1 - dist / 120) * 0.08;
            ctx.stroke();
          }
        });
      });

      ctx.globalAlpha = 1;
    };

    const drawGlowOrbs = () => {
      const orbCount = 3;
      for (let i = 0; i < orbCount; i++) {
        const x = canvas.width * (0.2 + i * 0.3) + Math.sin(time * 0.3 + i * 2) * 50;
        const y = canvas.height * 0.4 + Math.cos(time * 0.2 + i) * 30;
        const radius = 80 + Math.sin(time + i) * 20;

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, 'rgba(20, 184, 166, 0.08)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.04)');
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }
    };

    const animate = () => {
      time += 0.016;
      
      // Clear with fade for trails
      ctx.fillStyle = 'rgba(5, 5, 5, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      drawAurora();
      drawGlowOrbs();
      drawConnections();
      drawParticles();

      animationId = requestAnimationFrame(animate);
    };

    resize();
    createParticles();
    animate();

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ 
        background: 'linear-gradient(135deg, #050505 0%, #0a0a0a 50%, #050510 100%)',
      }}
    />
  );
};
