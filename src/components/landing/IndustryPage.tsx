"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { IndustryData } from "@/data/industries";

interface IndustryPageProps {
  data: IndustryData;
  onDemoClick: () => void;
}

export function IndustryPage({ data, onDemoClick }: IndustryPageProps) {
  const themeColors = {
    purple: { bg: "bg-purple-600", text: "text-purple-600", light: "bg-purple-50", gradient: "from-purple-600 to-pink-500", border: "border-purple-200" },
    blue: { bg: "bg-blue-600", text: "text-blue-600", light: "bg-blue-50", gradient: "from-blue-600 to-cyan-500", border: "border-blue-200" },
    green: { bg: "bg-emerald-600", text: "text-emerald-600", light: "bg-emerald-50", gradient: "from-emerald-600 to-teal-500", border: "border-emerald-200" },
    orange: { bg: "bg-orange-500", text: "text-orange-500", light: "bg-orange-50", gradient: "from-orange-500 to-red-500", border: "border-orange-200" },
    cyan: { bg: "bg-cyan-600", text: "text-cyan-600", light: "bg-cyan-50", gradient: "from-cyan-500 to-blue-500", border: "border-cyan-200" }
  };

  const theme = themeColors[data.colorTheme as keyof typeof themeColors] || themeColors.purple;

  return (
    <div className="pt-24 animate-in fade-in duration-500">
      <section className="relative py-24 px-4 overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b ${theme.light} to-white -z-10 opacity-50`} />
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 shadow-sm">
            <data.icon className={`w-3.5 h-3.5 ${theme.text}`} />
            {data.name}
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 mb-6 leading-tight">
            {data.hero.title} <br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
              {data.hero.highlight}
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-10">
            {data.hero.subtitle}
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={onDemoClick}
              className="px-8 py-4 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-all shadow-lg hover:-translate-y-0.5 cursor-pointer"
            >
              Try Live Demo
            </button>
            <a href="#booking" className="px-8 py-4 bg-white border border-slate-200 text-slate-900 rounded-full font-bold hover:bg-slate-50 transition-all shadow-sm">
              Book Strategy Call
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How It Works for {data.name}</h2>
            <p className="text-slate-500 mt-2">Seamless automation from call to resolution.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative">
            <div className="flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full md:w-64 h-full min-h-[220px]">
              <div className={`w-16 h-16 ${theme.light} rounded-full flex items-center justify-center mb-4`}>
                <data.flow.step1.icon className={`w-8 h-8 ${theme.text}`} />
              </div>
              <h3 className="font-bold text-slate-900">{data.flow.step1.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{data.flow.step1.desc}</p>
            </div>

            <div className="flex flex-col items-center text-center bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl w-full md:w-64 transform md:-translate-y-4 h-full min-h-[240px]">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 relative">
                <data.flow.step2.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-white">{data.flow.step2.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{data.flow.step2.desc}</p>
            </div>

            <div className="flex flex-col items-center text-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm w-full md:w-64 h-full min-h-[220px]">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <data.flow.step3.icon className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-slate-900">{data.flow.step3.title}</h3>
              <p className="text-sm text-slate-500 mt-2">{data.flow.step3.desc}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-16">Handles Real Industry Conversations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.useCases.map((card, i) => (
              <div key={i} className={`bg-white p-8 rounded-3xl border border-slate-200 hover:shadow-xl transition-all duration-300`}>
                <div className={`w-12 h-12 ${theme.light} rounded-xl flex items-center justify-center mb-6`}>
                  <card.icon className={`w-6 h-6 ${theme.text}`} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{card.title}</h3>
                <div className="space-y-3">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <span className="text-xs font-bold text-slate-400 block mb-1">{card.trigger}</span>
                    <p className="text-sm font-medium text-slate-700">"{card.query}"</p>
                  </div>
                  <div className="flex justify-center">
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </div>
                  <div className={`${theme.light} p-3 rounded-lg border border-slate-100`}>
                    <span className={`text-xs font-bold ${theme.text} block mb-1 opacity-70`}>AI Action:</span>
                    <p className={`text-sm ${theme.text} font-medium`}>{card.response}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-12">ROI You Can Measure</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {data.stats.map((stat, idx) => (
              <div key={idx} className="p-6 bg-white/5 rounded-2xl backdrop-blur border border-white/10">
                <div className={`text-4xl md:text-5xl font-bold ${theme.text} mb-2 brightness-125`}>
                  {stat.val}<span className="text-2xl opacity-70">{stat.suffix}</span>
                </div>
                <div className="text-sm font-medium text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
