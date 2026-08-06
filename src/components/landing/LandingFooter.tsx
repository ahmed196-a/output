"use client";

import Link from "next/link";
import { Phone, Mail, Shield, FileText } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-16 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <Phone className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">CallAutomate</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Enterprise Voice AI Receptionist & Call Automation Infrastructure.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing Plans</a></li>
              <li><a href="#live-demo" className="hover:text-white transition-colors">Live Interactive Demo</a></li>
            </ul>
          </div>

          {/* Portal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Account & Portal</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
              <li><Link href="/auth/register" className="hover:text-white transition-colors">Create Account (30-Day Trial)</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Client Dashboard</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">Contact</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <span>support@callautomate.ai</span>
              </div>
              <p className="pt-2 text-[11px]">24/7 Monitoring & Telecom SLA Support</p>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-900 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} CallAutomate AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-slate-400 cursor-pointer">Cookie Settings</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
