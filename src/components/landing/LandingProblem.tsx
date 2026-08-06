"use client";

import React from "react";
import { PhoneMissed, Users, Clock, HelpCircle } from "lucide-react";

export function LandingProblem() {
  const problems = [
    {
      icon: PhoneMissed,
      title: "Missed Revenue",
      desc: "67% of customers hang up if sent to voicemail. Every missed call is a lost opportunity.",
    },
    {
      icon: Users,
      title: "Staff Burnout",
      desc: "Your team spends hours on repetitive FAQs and scheduling instead of high-value tasks.",
    },
    {
      icon: Clock,
      title: "Limited Availability",
      desc: "Business hours limit your growth. Customers want answers at 9 PM, not 9 AM.",
    },
    {
      icon: HelpCircle,
      title: "Inconsistent Service",
      desc: "Manual training takes time. Human moods vary. AI delivers perfection every time.",
    },
  ];

  return (
    <section className="py-24 relative bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 mb-4">The Hidden Cost of Silence</h2>
          <p className="text-slate-600 max-w-2xl mx-auto text-lg">
            Traditional phone systems leak revenue. Modern businesses need modern voice automation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((item, idx) => (
            <div
              key={idx}
              className="h-full p-8 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-indigo-300 hover:bg-white hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <item.icon className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
              <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
