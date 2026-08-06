"use client";

import { Sliders, PhoneCall, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Sliders,
    title: "Configure Agent & Prompts",
    description: "Choose your industry template or build custom prompts with specific business rules and FAQs.",
  },
  {
    number: "02",
    icon: PhoneCall,
    title: "Connect Phone Lines",
    description: "Assign dedicated local or toll-free phone numbers or forward your existing business number.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Go Live & Automate",
    description: "Your AI agent handles inbound calls, books appointments, and logs full transcripts instantly.",
  },
];

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">3-Step Onboarding</span>
          <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight mt-2 mb-4">
            How CallAutomate Works
          </h2>
          <p className="text-slate-600 text-lg">
            Set up your AI voice receptionist in less than 10 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="relative bg-slate-50 rounded-3xl p-8 border border-slate-200/80 hover:bg-white hover:shadow-xl transition-all duration-300"
            >
              <span className="text-5xl font-black text-slate-200 absolute top-6 right-6 font-mono">
                {step.number}
              </span>
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md shadow-indigo-500/20">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
