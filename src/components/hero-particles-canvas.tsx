"use client";

import { useEffect, useRef, useState } from "react";

const FADE_DISTANCE_DEFAULT = 320;
const MIN_PARTICLES = 18;
const LINK_DISTANCE = 120;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
};

type HeroParticlesCanvasProps = {
  fadeDistance?: number;
};

const createParticles = (count: number, width: number, height: number): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      radius: 1 + Math.random(),
      alpha: 0.18 + Math.random() * 0.18,
    });
  }
  return particles;
};

export function HeroParticlesCanvas({ fadeDistance = FADE_DISTANCE_DEFAULT }: HeroParticlesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const resizeRef = useRef<ResizeObserver | null>(null);
  const sizeRef = useRef({ width: 0, height: 0 });
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    let rafId: number | null = null;

    const updateFade = () => {
      rafId = null;
      const nextFade = clamp(1 - window.scrollY / fadeDistance, 0, 1);
      setOpacity(nextFade);
    };

    const handleScroll = () => {
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(updateFade);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      window.removeEventListener("scroll", handleScroll);
    };
  }, [fadeDistance]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) {
        return;
      }
      const rect = parent.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      sizeRef.current = { width, height };

      const targetCount = Math.max(MIN_PARTICLES, Math.round((width * height) / 18000));
      particlesRef.current = createParticles(targetCount, width, height);
    };

    resizeCanvas();
    resizeRef.current = new ResizeObserver(resizeCanvas);
    if (canvas.parentElement) {
      resizeRef.current.observe(canvas.parentElement);
    }

    const draw = () => {
      const { width, height } = sizeRef.current;
      if (width === 0 || height === 0) {
        animationRef.current = window.requestAnimationFrame(draw);
        return;
      }

      context.clearRect(0, 0, width, height);

      const particles = particlesRef.current;
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            const alpha = ((1 - dist / LINK_DISTANCE) * 0.12).toFixed(3);
            context.strokeStyle = `rgba(15, 23, 42, ${alpha})`;
            context.lineWidth = 1;
            context.beginPath();
            context.moveTo(particles[i].x, particles[i].y);
            context.lineTo(particles[j].x, particles[j].y);
            context.stroke();
          }
        }
      }

      for (const particle of particles) {
        context.fillStyle = `rgba(15, 23, 42, ${particle.alpha})`;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;
      }

      animationRef.current = window.requestAnimationFrame(draw);
    };

    animationRef.current = window.requestAnimationFrame(draw);

    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
      }
      resizeRef.current?.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 ease-out"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
