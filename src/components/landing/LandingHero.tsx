"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone, ArrowRight, CheckCircle2, Calendar, UserCheck, Mail, Mic, FileText, Star, Clock, BarChart3, Headphones, Sparkles, Activity
} from "lucide-react";

interface LandingHeroProps {
  onDemoClick: () => void;
}

export function LandingHero({ onDemoClick }: LandingHeroProps) {
  // 1. Live Conversation Timeline State (0s to 12s loop)
  const [timelineStep, setTimelineStep] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  // 2. Mouse Parallax Tilt State for Phone
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const phoneRef = useRef<HTMLDivElement>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);

  // 3. Count Up Stats Animation State
  const [statsCount, setStatsCount] = useState({ calls: 0, csat: 0, minutes: 0, uptime: 0 });

  // Handle Mouse Parallax
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!phoneRef.current) return;
    const rect = phoneRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x: x * 5, y: y * -5 });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  // Timeline Auto Loop (12-15s sequence)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimelineStep((prev) => {
        const next = (prev + 1) % 13;
        if (next === 2 || next === 3) setIsTyping(true);
        else setIsTyping(false);
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Stats Count Up Animation
  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const intervalTime = 30;
    const steps = duration / intervalTime;

    const timer = setInterval(() => {
      start++;
      const progress = Math.min(start / steps, 1);
      setStatsCount({
        calls: Math.floor(progress * 10),
        csat: +(progress * 98.6).toFixed(1),
        minutes: +(progress * 2.5).toFixed(1),
        uptime: +(progress * 99.99).toFixed(2),
      });

      if (progress >= 1) clearInterval(timer);
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  // Natural Sine-Based Real-Time Audio Equalizer Waveform
  useEffect(() => {
    const canvas = waveformCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      phase += 0.08;

      const barCount = 18;
      const barWidth = 3;
      const gap = 5;
      const startX = (canvas.width - (barCount * (barWidth + gap))) / 2;

      for (let i = 0; i < barCount; i++) {
        const sineVal = Math.sin(phase + i * 0.4) * 0.5 + 0.5;
        const barHeight = Math.max(4, sineVal * (canvas.height * 0.75));
        const x = startX + i * (barWidth + gap);
        const y = (canvas.height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, "#2563FF");
        gradient.addColorStop(0.5, "#7B5CFF");
        gradient.addColorStop(1, "#00D4FF");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <section
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex flex-col justify-between overflow-hidden pt-28 pb-16 bg-white dark:bg-[#050816] text-slate-900 dark:text-white transition-colors duration-300"
    >
      {/* 1. Background Mesh Radial Glows & Dotted Grid */}
      <div className="absolute inset-0 bg-white dark:bg-[#050816]" />
      <div className="absolute inset-0 hidden dark:block bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(11,21,53,0.9),rgba(5,8,22,1))]" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[650px] hidden dark:block bg-gradient-to-tr from-[#0B1535]/80 via-[#7B5CFF]/15 to-[#00D4FF]/20 blur-[140px] rounded-full pointer-events-none z-0" />

      {/* Dotted Grid Overlay */}
      <div className="absolute inset-0 bg-hero-grid opacity-10 dark:opacity-35 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      {/* Hero Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow flex flex-col justify-center">
        
        {/* Two-Column Hero Grid (Left 6 Cols, Right 6 Cols for ample text spacing) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-6">

          {/* LEFT COLUMN (6/12 Cols - Z-Index 20 to prevent overlapping) */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-6 z-20">
            
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] backdrop-blur-md shadow-sm dark:shadow-lg dark:shadow-[#00D4FF]/5 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-[#00D4FF] animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-[#A8B3CF]">
                ENTERPRISE VOICE AI PLATFORM
              </span>
            </div>

            {/* Large Heading Hierarchy (Automate Calls with smaller, CallAutomate AI much larger & prominent) */}
            <div className="font-sans">
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-600 dark:text-[#A8B3CF] uppercase tracking-wide block mb-1">
                Automate Calls with
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight bg-gradient-to-r from-[#7B5CFF] via-[#00D4FF] to-[#2563FF] bg-clip-text text-transparent drop-shadow-[0_0_40px_rgba(0,212,255,0.4)] block leading-[1.05]">
                CallAutomate AI
              </h1>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-slate-600 dark:text-[#A8B3CF] max-w-lg leading-relaxed">
              Deploy intelligent voice agents that handle <strong className="text-slate-900 dark:text-white">bookings</strong>, <strong className="text-slate-900 dark:text-white">customer support</strong>, and <strong className="text-slate-900 dark:text-white">outbound sales</strong> 24/7. Indistinguishable from human agents.
            </p>

            {/* Two CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {/* Primary Button */}
              <button
                onClick={onDemoClick}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-sm font-extrabold text-white rounded-full bg-gradient-to-r from-[#2563FF] via-[#7B5CFF] to-[#A855F7] hover:from-[#1E52D9] hover:to-[#9333EA] shadow-lg shadow-[#2563FF]/30 hover:shadow-[#7B5CFF]/50 transition-all hover:-translate-y-0.5 cursor-pointer overflow-hidden"
              >
                <span>Try Live Demo</span>
                <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <Phone className="w-3.5 h-3.5 fill-white text-white" />
                </div>
              </button>

              {/* Secondary Button */}
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-[rgba(18,24,48,0.75)] border border-slate-200 dark:border-white/[0.08] rounded-full hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-md cursor-pointer"
              >
                <span>Explore Pricing</span>
                <ArrowRight className="w-4 h-4 text-indigo-600 dark:text-[#00D4FF] group-hover:translate-x-1 transition-transform" />
              </a>
            </div>

            {/* Small Trusted Users Row */}
            <div className="flex items-center gap-3 pt-4 text-xs text-slate-600 dark:text-[#A8B3CF]">
              <div className="flex -space-x-2.5 overflow-hidden">
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#050816] object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="User" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#050816] object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="User" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#050816] object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="User" />
                <img className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-[#050816] object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="User" />
              </div>
              <span>Trusted by <strong className="text-slate-900 dark:text-white font-bold">10,000+</strong> businesses worldwide</span>
            </div>

          </div>

          {/* RIGHT COLUMN (6/12 Cols Focal Point - Relative Container for Cards) */}
          <div className="lg:col-span-6 relative flex flex-col items-center justify-center min-h-[560px] z-10">
            
            {/* SVG Stripe-Style Connecting Path Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none hidden sm:block z-0" viewBox="0 0 600 550" fill="none">
              {/* Left Curve Paths */}
              <path d="M 300 200 C 200 200, 140 110, 60 110" stroke="url(#stroke-grad-1)" strokeWidth="1.5" className="animate-svg-flow" />
              <path d="M 300 260 C 190 260, 130 230, 50 230" stroke="url(#stroke-grad-1)" strokeWidth="1.5" className="animate-svg-flow" />
              <path d="M 300 320 C 190 320, 130 340, 50 340" stroke="url(#stroke-grad-1)" strokeWidth="1.5" className="animate-svg-flow" />
              <path d="M 300 380 C 200 380, 140 440, 60 440" stroke="url(#stroke-grad-1)" strokeWidth="1.5" className="animate-svg-flow" />

              {/* Right Curve Paths */}
              <path d="M 300 200 C 400 200, 460 110, 540 110" stroke="url(#stroke-grad-2)" strokeWidth="1.5" className="animate-svg-flow" />
              <path d="M 300 260 C 410 260, 470 230, 550 230" stroke="url(#stroke-grad-2)" strokeWidth="1.5" className="animate-svg-flow" />
              <path d="M 300 320 C 410 320, 470 340, 550 340" stroke="url(#stroke-grad-2)" strokeWidth="1.5" className="animate-svg-flow" />
              <path d="M 300 380 C 400 380, 460 440, 540 440" stroke="url(#stroke-grad-2)" strokeWidth="1.5" className="animate-svg-flow" />

              <defs>
                <linearGradient id="stroke-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#7B5CFF" stopOpacity="0.2" />
                </linearGradient>
                <linearGradient id="stroke-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#7B5CFF" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity="0.8" />
                </linearGradient>
              </defs>
            </svg>

            {/* 8 FLOATING GLASS AUTOMATION CARDS POSITIONED TIGHTLY AROUND PHONE */}

            {/* Left Card 1: Appointment Booked */}
            <div className={`hidden sm:flex animate-float-1 items-center gap-3 absolute -left-6 xl:left-0 top-4 z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(0,212,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${timelineStep >= 7 ? "ring-2 ring-[#00D4FF] shadow-[0_0_30px_rgba(0,212,255,0.5)]" : ""}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#00D4FF] to-[#2563FF] text-white flex items-center justify-center shrink-0 shadow-md">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Appointment Booked</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5">2:30 PM, Tue</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Left Card 2: CRM Updated */}
            <div className={`hidden sm:flex animate-float-2 items-center gap-3 absolute -left-4 xl:left-2 top-[135px] z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(139,92,246,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${timelineStep >= 8 ? "ring-2 ring-[#8B5CF6] shadow-[0_0_30px_rgba(139,92,246,0.5)]" : ""}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8B5CF6] to-[#6366F1] text-white flex items-center justify-center shrink-0 shadow-md">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">CRM Updated</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5">New Lead Added</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Left Card 3: Confirmation Email */}
            <div className={`hidden sm:flex animate-float-3 items-center gap-3 absolute -left-4 xl:left-2 top-[265px] z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(34,197,94,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${timelineStep >= 9 ? "ring-2 ring-[#22C55E] shadow-[0_0_30px_rgba(34,197,94,0.5)]" : ""}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#22C55E] to-[#10B981] text-white flex items-center justify-center shrink-0 shadow-md">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Confirmation Email</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5 truncate max-w-[100px]">jordanm@email.com</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Left Card 4: Call Recording */}
            <div className="hidden sm:flex animate-float-1 items-center gap-3 absolute -left-6 xl:left-0 bottom-6 z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F59E0B] to-[#FB7185] text-white flex items-center justify-center shrink-0 shadow-md">
                <Mic className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Call Recording</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5">Saved 00:02:14</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Right Card 1: Transcript Generated */}
            <div className={`hidden sm:flex animate-float-2 items-center gap-3 absolute -right-6 xl:right-0 top-4 z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(168,85,247,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${timelineStep >= 10 ? "ring-2 ring-[#A855F7] shadow-[0_0_30px_rgba(168,85,247,0.5)]" : ""}`}>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#A855F7] to-[#EC4899] text-white flex items-center justify-center shrink-0 shadow-md">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Transcript Generated</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5">AI Summarized</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Right Card 2: Lead Qualified */}
            <div className="hidden sm:flex animate-float-3 items-center gap-3 absolute -right-4 xl:right-2 top-[135px] z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(20,184,166,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#14B8A6] to-[#06B6D4] text-white flex items-center justify-center shrink-0 shadow-md">
                <Star className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Lead Qualified</p>
                <div className="flex text-[#F59E0B] text-[10px] gap-0.5 mt-0.5">★ ★ ★ ★ ★</div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Right Card 3: Follow-up Scheduled */}
            <div className="hidden sm:flex animate-float-1 items-center gap-3 absolute -right-4 xl:right-2 top-[265px] z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(37,99,255,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563FF] to-[#3B82F6] text-white flex items-center justify-center shrink-0 shadow-md">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Follow-up Scheduled</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5">Wed, 10:00 AM</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* Right Card 4: Analytics Updated */}
            <div className="hidden sm:flex animate-float-2 items-center gap-3 absolute -right-6 xl:right-0 bottom-6 z-20 p-3 rounded-[20px] bg-white/90 dark:bg-[rgba(18,24,48,0.75)] backdrop-blur-[18px] border border-slate-200/80 dark:border-white/[0.08] shadow-lg dark:shadow-[0_8px_32px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03]">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#00D4FF] text-white flex items-center justify-center shrink-0 shadow-md">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Analytics Updated</p>
                <p className="text-[10px] text-slate-600 dark:text-[#A8B3CF] mt-0.5">100% Conversion</p>
              </div>
              <CheckCircle2 className="w-4 h-4 text-[#22C55E] ml-1" />
            </div>

            {/* CENTRAL 3D PHONE MOCKUP (55% Width Focal Point with Parallax Tilt) */}
            <div
              ref={phoneRef}
              style={{
                transform: `perspective(1000px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg) rotateZ(0deg)`,
                transition: "transform 0.15s ease-out",
              }}
              className="relative z-10 w-full max-w-[320px] sm:max-w-[340px] rounded-[44px] p-4 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 dark:from-[#0D1B4F]/90 dark:via-[#0B1535] dark:to-[#071126] border-4 border-blue-500/40 dark:border-[#2563FF]/30 shadow-2xl shadow-cyan-500/20 dark:shadow-[0_20px_80px_rgba(0,212,255,0.25)] backdrop-blur-[24px]"
            >
              {/* Phone Top Notch & Status */}
              <div className="flex items-center justify-between px-6 pt-1 pb-3 text-[11px] text-slate-400 dark:text-[#A8B3CF] font-mono">
                <span>9:41</span>
                <div className="w-18 h-4 rounded-full bg-slate-950 dark:bg-[#050816] border border-white/[0.08]" />
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span>5G</span>
                </div>
              </div>

              {/* Top Caller Header */}
              <div className="flex flex-col items-center text-center py-2 border-b border-white/[0.08] mb-3">
                <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#7B5CFF] to-[#00D4FF] text-white font-extrabold flex items-center justify-center text-base shadow-lg shadow-[#7B5CFF]/30 mb-1.5">
                  JM
                </div>
                <h3 className="font-bold text-white text-sm">Jordan M.</h3>
                <div className="flex items-center gap-1.5 text-[11px] text-[#22C55E] font-medium mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-ping" />
                  <span>● Connected 00:14</span>
                </div>
              </div>

              {/* Conversation Area (Automated Live Replay Loop 0-12s) */}
              <div className="space-y-3 p-1 text-xs min-h-[210px] flex flex-col justify-start">
                
                {/* 0s+: Customer Utterance 1 */}
                {timelineStep >= 0 && (
                  <div className="flex flex-col items-start space-y-1 animate-fade-in">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-[#A8B3CF] uppercase tracking-wider">Customer</span>
                    <div className="max-w-[88%] rounded-2xl rounded-tl-xs bg-white/[0.08] border border-white/[0.1] text-white p-3 text-[11px] leading-relaxed shadow-sm">
                      Hi, do you have Tuesday open?
                    </div>
                  </div>
                )}

                {/* 2s: Typing Indicator Dots */}
                {isTyping && (
                  <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-[#2563FF]/20 border border-[#2563FF]/30 w-fit animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00D4FF] animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7B5CFF] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                {/* 4s+: AI Agent Utterance */}
                {timelineStep >= 4 && (
                  <div className="flex flex-col items-end space-y-1 animate-fade-in">
                    <span className="text-[9px] font-bold text-[#00D4FF] uppercase tracking-wider">AI Agent</span>
                    <div className="max-w-[88%] rounded-2xl rounded-tr-xs bg-gradient-to-r from-[#2563FF] via-[#7B5CFF] to-[#A855F7] text-white p-3 text-[11px] leading-relaxed shadow-md shadow-[#7B5CFF]/20">
                      Yes. 2:30 or 4 PM both work. Want me to lock in 2:30?
                    </div>
                  </div>
                )}

                {/* 7s+: Customer Utterance 2 */}
                {timelineStep >= 7 && (
                  <div className="flex flex-col items-start space-y-1 animate-fade-in">
                    <span className="text-[9px] font-bold text-slate-400 dark:text-[#A8B3CF] uppercase tracking-wider">Customer</span>
                    <div className="max-w-[88%] rounded-2xl rounded-tl-xs bg-white/[0.08] border border-white/[0.1] text-white p-3 text-[11px] leading-relaxed shadow-sm">
                      Perfect.
                    </div>
                  </div>
                )}
              </div>

              {/* Sine Audio Waveform Canvas */}
              <div className="py-2 flex items-center justify-center border-t border-white/[0.08] mt-2">
                <canvas ref={waveformCanvasRef} width={240} height={36} className="w-full max-w-[220px]" />
              </div>

              {/* Bottom In-Call Action Buttons */}
              <div className="flex items-center justify-around pt-2 pb-1 px-3">
                <button className="w-9 h-9 rounded-full bg-white/[0.1] border border-white/[0.1] text-white flex items-center justify-center hover:bg-white/[0.2] transition">
                  <Mic className="w-4 h-4" />
                </button>
                <button className="w-11 h-11 rounded-full bg-[#EF4444] text-white flex items-center justify-center shadow-lg shadow-[#EF4444]/40 hover:bg-[#DC2626] transition">
                  <Phone className="w-4.5 h-4.5 fill-white rotate-[135deg]" />
                </button>
                <button className="w-9 h-9 rounded-full bg-white/[0.1] border border-white/[0.1] text-white flex items-center justify-center hover:bg-white/[0.2] transition">
                  <Headphones className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* HOLOGRAPHIC CALLAUTOMATE AI CORE (Below Phone) */}
            <div className="relative mt-[-20px] z-0 flex flex-col items-center">
              
              {/* Outer Counter-Rotating Ring */}
              <div className="w-64 h-64 rounded-full border border-dashed border-[#00D4FF]/30 absolute -top-24 animate-spin-cw pointer-events-none" />
              
              {/* Inner Clockwise Rotating Ring */}
              <div className="w-48 h-48 rounded-full border border-dotted border-[#7B5CFF]/40 absolute -top-16 animate-spin-ccw pointer-events-none" />

              {/* Breathing Glow Pedestal Base */}
              <div className="w-56 h-12 rounded-full bg-gradient-to-r from-[#00D4FF]/30 via-[#7B5CFF]/40 to-[#A855F7]/30 blur-xl animate-breathe-glow" />

              {/* Center Logo Pedestal Icon */}
              <div className="w-12 h-12 rounded-full bg-slate-900 dark:bg-[rgba(18,24,48,0.9)] border border-[#00D4FF]/50 shadow-[0_0_30px_rgba(0,212,255,0.4)] flex items-center justify-center text-white font-black text-sm mt-[-28px] z-10 backdrop-blur-md">
                <span className="bg-gradient-to-tr from-[#00D4FF] via-[#7B5CFF] to-[#A855F7] bg-clip-text text-transparent">C</span>
              </div>
            </div>

          </div>

        </div>

        {/* METRICS BAR (Below Hero) */}
        <div className="w-full max-w-6xl mx-auto my-12 p-6 sm:p-8 rounded-[24px] bg-white/90 dark:bg-[var(--surface)]/90 backdrop-blur-[18px] border border-slate-200/80 dark:border-[var(--border)] shadow-xl dark:shadow-[0_12px_40px_rgba(0,0,0,0.5)] grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-indigo-600 dark:text-[#00D4FF] flex items-center justify-center mb-2 border border-blue-500/20">
              <Phone className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsCount.calls}K+</p>
            <p className="text-xs text-slate-600 dark:text-[#A8B3CF] font-medium mt-1">Calls Automated Daily</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-[#A855F7] flex items-center justify-center mb-2 border border-purple-500/20">
              <Star className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsCount.csat}%</p>
            <p className="text-xs text-slate-600 dark:text-[#A8B3CF] font-medium mt-1">Customer Satisfaction</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#22C55E] flex items-center justify-center mb-2 border border-emerald-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsCount.minutes}M+</p>
            <p className="text-xs text-slate-600 dark:text-[#A8B3CF] font-medium mt-1">Minutes Saved Monthly</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-[#00D4FF] flex items-center justify-center mb-2 border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{statsCount.uptime}%</p>
            <p className="text-xs text-slate-600 dark:text-[#A8B3CF] font-medium mt-1">Uptime Reliability</p>
          </div>

        </div>

      </div>
    </section>
  );
}
