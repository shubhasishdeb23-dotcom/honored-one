import { useEffect, useRef } from 'react';

export const FluidBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Fluid simulation parameters
    const blobs: Array<{
      x: number;
      y: number;
      radius: number;
      vx: number;
      vy: number;
      color: string;
      phase: number;
      amplitude: number;
      frequency: number;
    }> = [];

    // Create organic blobs
    const colors = [
      { r: 20, g: 184, b: 166 },  // Teal
      { r: 6, g: 182, b: 212 },   // Cyan
      { r: 99, g: 102, b: 241 },  // Indigo
      { r: 139, g: 92, b: 246 },  // Purple
      { r: 236, g: 72, b: 153 },  // Pink
    ];

    // Initialize blobs with organic movement parameters
    for (let i = 0; i < 6; i++) {
      const color = colors[i % colors.length];
      blobs.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 150 + Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        color: `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`,
        phase: Math.random() * Math.PI * 2,
        amplitude: 50 + Math.random() * 100,
        frequency: 0.0005 + Math.random() * 0.001,
      });
    }

    const animate = () => {
      timeRef.current += 0.016; // ~60fps time step
      
      // Clear with fade effect for trails
      ctx.fillStyle = 'rgba(5, 5, 5, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw blobs
      blobs.forEach((blob, i) => {
        // Organic movement using sine waves
        const time = timeRef.current;
        const waveX = Math.sin(time * blob.frequency * 100 + blob.phase) * blob.amplitude;
        const waveY = Math.cos(time * blob.frequency * 80 + blob.phase * 1.5) * blob.amplitude;

        // Update position with smooth interpolation
        blob.x += blob.vx + waveX * 0.01;
        blob.y += blob.vy + waveY * 0.01;

        // Bounce off edges with soft boundaries
        const padding = blob.radius * 0.5;
        if (blob.x < -padding) blob.x = canvas.width + padding;
        if (blob.x > canvas.width + padding) blob.x = -padding;
        if (blob.y < -padding) blob.y = canvas.height + padding;
        if (blob.y > canvas.height + padding) blob.y = -padding;

        // Pulsing radius
        const pulseRadius = blob.radius + Math.sin(time * 2 + i) * 30;

        // Draw soft gradient blob
        const gradient = ctx.createRadialGradient(
          blob.x, blob.y, 0,
          blob.x, blob.y, pulseRadius
        );
        
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(0.5, blob.color.replace('0.15', '0.08'));
        gradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      // Draw flowing wave lines
      const waveCount = 3;
      for (let w = 0; w < waveCount; w++) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(20, 184, 166, ${0.02 + w * 0.01})`;
        ctx.lineWidth = 1;

        const yOffset = canvas.height * (0.3 + w * 0.2);
        const amplitude = 30 + w * 20;
        const frequency = 0.003 + w * 0.001;
        const speed = timeRef.current * (0.5 + w * 0.2);

        ctx.moveTo(0, yOffset);
        for (let x = 0; x <= canvas.width; x += 5) {
          const y = yOffset + 
            Math.sin(x * frequency + speed) * amplitude +
            Math.sin(x * frequency * 2 + speed * 1.5) * (amplitude * 0.3);
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw subtle particle grid
      const gridSize = 80;
      const particleSize = 1;
      for (let x = 0; x < canvas.width; x += gridSize) {
        for (let y = 0; y < canvas.height; y += gridSize) {
          const distFromCenter = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + 
            Math.pow(y - canvas.height / 2, 2)
          );
          const maxDist = Math.sqrt(
            Math.pow(canvas.width / 2, 2) + 
            Math.pow(canvas.height / 2, 2)
          );
          const alpha = 0.1 - (distFromCenter / maxDist) * 0.08;
          
          // Animate particles with wave motion
          const offsetX = Math.sin(timeRef.current + x * 0.01) * 3;
          const offsetY = Math.cos(timeRef.current + y * 0.01) * 3;
          
          ctx.beginPath();
          ctx.arc(x + offsetX, y + offsetY, particleSize, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.fill();
        }
      }

      // Draw flowing aurora effect at top
      const auroraGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      auroraGradient.addColorStop(0, 'transparent');
      auroraGradient.addColorStop(0.3, 'rgba(20, 184, 166, 0.03)');
      auroraGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.05)');
      auroraGradient.addColorStop(0.7, 'rgba(139, 92, 246, 0.03)');
      auroraGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = auroraGradient;
      const auroraHeight = 200 + Math.sin(timeRef.current * 0.5) * 50;
      ctx.fillRect(0, 0, canvas.width, auroraHeight);

      // Animate aurora shimmer
      const shimmerX = (Math.sin(timeRef.current * 0.3) + 1) / 2 * canvas.width;
      const shimmerGradient = ctx.createRadialGradient(
        shimmerX, 100, 0,
        shimmerX, 100, 300
      );
      shimmerGradient.addColorStop(0, 'rgba(6, 182, 212, 0.08)');
      shimmerGradient.addColorStop(1, 'transparent');
      ctx.fillStyle = shimmerGradient;
      ctx.fillRect(0, 0, canvas.width, auroraHeight);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
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
