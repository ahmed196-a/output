"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown, LogIn, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { TrialBanner } from "./TrialBanner";

const Logo = () => (
  <svg width="40" height="40" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg hover:scale-105 transition-transform duration-300">
    <defs>
      <linearGradient id="c-gradient-final" x1="256" y1="50" x2="256" y2="462" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#A855F7" />
        <stop offset="0.5" stopColor="#4F46E5" />
        <stop offset="1" stopColor="#06B6D4" />
      </linearGradient>
      <linearGradient id="robot-cyan" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="100%" stopColor="#0891B2" />
      </linearGradient>
    </defs>
    <path 
      d="M385 130C345 85 290 60 230 60C120 60 35 150 35 260C35 370 120 460 230 460C300 460 365 425 410 375" 
      stroke="url(#c-gradient-final)" 
      strokeWidth="82" 
      strokeLinecap="round" 
      fill="none"
    />
    <path 
      d="M325 190C305 160 270 145 230 145C165 145 110 195 110 260C110 325 165 375 230 375C270 375 305 360 325 330" 
      fill="#000000" 
    />
    <g transform="translate(148, 160) scale(0.92)">
      <path d="M35 125C35 45 185 45 185 125" stroke="#1e293b" strokeWidth="14" fill="none" strokeLinecap="round" />
      <rect x="30" y="85" width="160" height="135" rx="45" fill="url(#robot-cyan)" stroke="#1e293b" strokeWidth="8" />
      <rect x="48" y="105" width="124" height="95" rx="28" fill="white" />
      <g stroke="#1e293b" strokeWidth="8" strokeLinecap="round" fill="none">
        <path d="M78 142C82 138 92 138 96 142" />
        <path d="M124 142C128 138 138 138 142 142" />
        <path d="M95 175C105 185 135 185 145 175" />
      </g>
    </g>
  </svg>
);

interface LandingHeaderProps {
  onNavigate: (view: string) => void;
  onUpgradeClick?: () => void;
}

export function LandingHeader({ onNavigate, onUpgradeClick }: LandingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (view: string) => {
    onNavigate(view);
    setMobileOpen(false);
    setDropdownOpen(false);
  };

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-[#050816]/90 backdrop-blur-xl border-b border-slate-200/80 dark:border-white/10 shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div onClick={() => handleNavClick("home")} className="flex items-center gap-3 cursor-pointer group">
            <Logo />
            <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white font-sans">
              CallAutomate
            </span>
          </div>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => handleNavClick("features")} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00D4FF] text-sm font-semibold transition-colors cursor-pointer">
              Features
            </button>

            {/* Industries Dropdown */}
            <div
              className="relative group"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00D4FF] text-sm font-semibold transition-colors flex items-center gap-1 cursor-pointer">
                Industries <ChevronDown className="w-3.5 h-3.5 mt-0.5" />
              </button>

              <div className={`absolute top-full left-0 w-56 bg-white dark:bg-[#0D1B4F] rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 py-2 transition-all duration-200 origin-top-left ${dropdownOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"}`}>
                <button onClick={() => handleNavClick("industry-restaurant")} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-[#00D4FF] transition-colors font-medium cursor-pointer">Restaurants & Takeaways</button>
                <button onClick={() => handleNavClick("industry-salon")} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-[#00D4FF] transition-colors font-medium cursor-pointer">Salons & Spas</button>
                <button onClick={() => handleNavClick("industry-real-estate")} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-[#00D4FF] transition-colors font-medium cursor-pointer">Real Estate</button>
                <button onClick={() => handleNavClick("industry-logistics")} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-[#00D4FF] transition-colors font-medium cursor-pointer">Logistics</button>
                <button onClick={() => handleNavClick("industry-healthcare")} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-[#00D4FF] transition-colors font-medium cursor-pointer">Healthcare</button>
                <button onClick={() => handleNavClick("industry-retail")} className="block w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-[#00D4FF] transition-colors font-medium cursor-pointer">Retail</button>
              </div>
            </div>

            <button onClick={() => handleNavClick("how-it-works")} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00D4FF] text-sm font-semibold transition-colors cursor-pointer">
              How it Works
            </button>
            <button onClick={() => handleNavClick("pricing")} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00D4FF] text-sm font-semibold transition-colors cursor-pointer">
              Pricing
            </button>
            <button onClick={() => handleNavClick("contact")} className="text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00D4FF] text-sm font-semibold transition-colors cursor-pointer">
              Contact Us
            </button>
          </div>

          {/* Right Controls */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            <TrialBanner onUpgradeClick={onUpgradeClick} />

            <button
              onClick={() => handleNavClick("booking")}
              className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white px-6 py-2.5 rounded-full text-xs font-extrabold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer hover:-translate-y-0.5"
            >
              Book a Demo →
            </button>

            {isAuthenticated && user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <LayoutDashboard className="w-4 h-4 text-white" />
                <span>Dashboard</span>
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-900 dark:text-white border border-slate-200 dark:border-white/10 px-5 py-2.5 rounded-full text-xs font-bold transition-all"
              >
                <LogIn className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                <span>Sign In</span>
              </Link>
            )}
          </div>

          {/* Mobile Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-slate-600 dark:text-white rounded-lg"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-3">
          <button onClick={() => handleNavClick("features")} className="block w-full text-left text-slate-700 font-medium py-2 px-3 hover:bg-slate-50 rounded-lg">Features</button>
          <div className="pl-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-3 py-1">Industries</span>
            <button onClick={() => handleNavClick("industry-restaurant")} className="block w-full text-left text-slate-600 py-1.5 px-3 text-sm">Restaurants & Takeaways</button>
            <button onClick={() => handleNavClick("industry-salon")} className="block w-full text-left text-slate-600 py-1.5 px-3 text-sm">Salons & Spas</button>
            <button onClick={() => handleNavClick("industry-real-estate")} className="block w-full text-left text-slate-600 py-1.5 px-3 text-sm">Real Estate</button>
            <button onClick={() => handleNavClick("industry-logistics")} className="block w-full text-left text-slate-600 py-1.5 px-3 text-sm">Logistics</button>
            <button onClick={() => handleNavClick("industry-healthcare")} className="block w-full text-left text-slate-600 py-1.5 px-3 text-sm">Healthcare</button>
            <button onClick={() => handleNavClick("industry-retail")} className="block w-full text-left text-slate-600 py-1.5 px-3 text-sm">Retail</button>
          </div>
          <button onClick={() => handleNavClick("how-it-works")} className="block w-full text-left text-slate-700 font-medium py-2 px-3 hover:bg-slate-50 rounded-lg">How it Works</button>
          <button onClick={() => handleNavClick("pricing")} className="block w-full text-left text-slate-700 font-medium py-2 px-3 hover:bg-slate-50 rounded-lg">Pricing</button>
          <button onClick={() => handleNavClick("contact")} className="block w-full text-left text-slate-700 font-medium py-2 px-3 hover:bg-slate-50 rounded-lg">Contact Us</button>
          <button onClick={() => handleNavClick("booking")} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl">Book a Demo</button>
        </div>
      )}
    </header>
  );
}
