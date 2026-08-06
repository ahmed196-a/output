"use client";

import React, { useEffect, useRef } from "react";
import { ArrowRight, Phone } from "lucide-react";

interface LandingHeroProps {
  onDemoClick: () => void;
}

export function LandingHero({ onDemoClick }: LandingHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas.width = window.innerWidth);
    let h = (canvas.height = window.innerHeight);

    const blobs = [
      { x: w * 0.3, y: h * 0.3, r: 300, color: "rgba(34, 211, 238, 0.15)", vx: 0.5, vy: 0.5 },
      { x: w * 0.7, y: h * 0.7, r: 350, color: "rgba(59, 130, 246, 0.15)", vx: -0.5, vy: -0.5 },
      { x: w * 0.5, y: h * 0.5, r: 250, color: "rgba(139, 92, 246, 0.12)", vx: 0.3, vy: -0.3 },
      { x: w * 0.8, y: h * 0.2, r: 200, color: "rgba(6, 182, 212, 0.1)", vx: -0.3, vy: 0.2 },
    ];

    let time = 0;
    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      time += 0.005;

      blobs.forEach((blob) => {
        blob.x += Math.sin(time + blob.vx) * 0.5;
        blob.y += Math.cos(time + blob.vy) * 0.5;

        const r = blob.r + Math.sin(time * 2 + blob.vx) * 20;
        const gradient = ctx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, r);
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(blob.x, blob.y, r * 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    };

    const handleResize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-28 pb-16">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/30 to-white/80 z-10 pointer-events-none" />

      <div className="relative z-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 mb-6 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
          <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
            Enterprise Voice Automation Platform
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.15]">
          Automate calls with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">
            CallAutomate AI
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Deploy intelligent voice agents that handle{" "}
          <button
            onClick={onDemoClick}
            className="text-slate-900 font-bold underline decoration-indigo-400 hover:text-indigo-600 transition-colors"
          >
            bookings
          </button>
          ,{" "}
          <button
            onClick={onDemoClick}
            className="text-slate-900 font-bold underline decoration-indigo-400 hover:text-indigo-600 transition-colors"
          >
            customer support
          </button>
          , and{" "}
          <button
            onClick={onDemoClick}
            className="text-slate-900 font-bold underline decoration-indigo-400 hover:text-indigo-600 transition-colors"
          >
            outbound sales
          </button>{" "}
          24/7. Indistinguishable from human agents.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={onDemoClick}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white bg-slate-900 rounded-full overflow-hidden transition-all hover:bg-slate-800 shadow-xl hover:shadow-2xl hover:-translate-y-0.5 cursor-pointer"
          >
            <span className="mr-2">Try Live Demo</span>
            <Phone className="w-4 h-4 text-indigo-400 fill-indigo-400" />
          </button>

          <a
            href="#pricing"
            className="group inline-flex items-center justify-center px-8 py-4 text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-full hover:bg-slate-50 transition-all shadow-sm hover:shadow-lg hover:-translate-y-0.5"
          >
            <span>Explore Pricing Plans</span>
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </section>
  );
}
