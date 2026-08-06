"use client";

import React, { useState } from "react";
import { Phone, PhoneOff, Loader2, Wrench, Utensils, Stethoscope, Scissors, Building2, Truck, Sparkles, CheckCircle2 } from "lucide-react";
import { LeadCapturePopup } from "./LeadCapturePopup";

interface Scenario {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  greeting: string;
  agentId?: string;
}

const scenarios: Scenario[] = [
  {
    id: "restaurant",
    name: "Restaurant Reservation & Orders",
    icon: Utensils,
    description: "Table bookings, takeout ordering, menu allergies & hours.",
    greeting: "Buona sera! Welcome to Bella Italia. Are you calling for a table reservation or takeout order?",
  },
  {
    id: "salon",
    name: "Salon & Spa Booking",
    icon: Scissors,
    description: "Stylist calendar check, service packages, and deposit links.",
    greeting: "Hello! Welcome to Glow Salon & Spa. How can I help you book your appointment today?",
  },
  {
    id: "real-estate",
    name: "Real Estate Buyer Qualification",
    icon: Building2,
    description: "Qualify buyers, open house RSVPs, and viewings scheduling.",
    greeting: "Hi there! Thanks for calling Premier Realty. Are you interested in scheduling a home viewing?",
  },
  {
    id: "plumber",
    name: "Emergency Plumbing Service",
    icon: Wrench,
    description: "Emergency dispatch, pricing quotes, and job scheduling.",
    greeting: "Thanks for calling QuickFix Plumbing. Do you have an emergency repair or standard maintenance?",
  },
  {
    id: "healthcare",
    name: "Medical Clinic Reception",
    icon: Stethoscope,
    description: "HIPAA triage, doctor check-ups, and prescription refills.",
    greeting: "Hello, this is Bright Health Clinic. Are you calling to book an appointment or request a refill?",
  },
  {
    id: "logistics",
    name: "Logistics & Dispatch",
    icon: Truck,
    description: "Driver check-ins, package tracking, and delivery rescheduling.",
    greeting: "Dispatch desk here. How can I assist with your shipment or delivery schedule?",
  },
];

export function LiveDemo() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(scenarios[0]);
  const [showLeadPopup, setShowLeadPopup] = useState(false);
  const [leadCaptured, setLeadCaptured] = useState<{ name: string; email: string; interestType: string } | null>(null);

  // Phone Call Outbound Mode
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callingState, setCallingState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [callStatusMessage, setCallStatusMessage] = useState("");

  const handleStartDemoClick = () => {
    if (!leadCaptured) {
      setShowLeadPopup(true);
    } else {
      triggerCall();
    }
  };

  const handleLeadSuccess = (data: { name: string; email: string; interestType: string }) => {
    setLeadCaptured(data);
    setShowLeadPopup(false);
    triggerCall();
  };

  const triggerCall = async () => {
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      alert("Please enter a valid phone number with country code (e.g. +1234567890)");
      return;
    }

    setCallingState("calling");
    setCallStatusMessage("Initiating outbound AI voice call...");

    try {
      const res = await fetch("/api/retell/phone-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toNumber: phoneNumber,
          customerName: leadCaptured?.name || "Valued Customer",
          scenario: selectedScenario.id,
        }),
      });

      const data = await res.json();
      if (data.error) {
        setCallStatusMessage(`Call notice: ${data.error}`);
        setCallingState("connected");
      } else {
        setCallStatusMessage("Call placed! Your phone should ring shortly.");
        setCallingState("connected");
      }
    } catch (err: any) {
      console.error("Outbound call error:", err);
      setCallStatusMessage("Call initiated. Stand by for incoming call on your phone.");
      setCallingState("connected");
    }
  };

  const handleEndCall = () => {
    setCallingState("ended");
    setTimeout(() => {
      setCallingState("idle");
      setCallStatusMessage("");
    }, 2000);
  };

  return (
    <section id="live-demo" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Interactive Voice Playground</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Test Our AI Voice Agent Live
          </h2>
          <p className="text-slate-400 text-lg">
            Select an industry scenario, enter your phone number, and experience sub-300ms real-time voice automation.
          </p>
        </div>

        {/* Scenario Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario.id === sc.id;
            const Icon = sc.icon;

            return (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc)}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/20 scale-[1.03]"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/50"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  isSelected ? "bg-white/20 text-white" : "bg-slate-800 text-indigo-400"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1 leading-snug">{sc.name}</h3>
                  <p className="text-[11px] opacity-75 line-clamp-2">{sc.description}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Scenario & Call Control Box */}
        <div className="max-w-3xl mx-auto bg-slate-950/80 border border-slate-800 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <selectedScenario.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white">{selectedScenario.name} Agent</h3>
              <p className="text-xs text-slate-400 italic">"{selectedScenario.greeting}"</p>
            </div>
          </div>

          {/* Phone Input Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Your Phone Number (with Country Code)
              </label>
              <div className="flex gap-3">
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={callingState === "calling" || callingState === "connected"}
                  className="flex-1 px-5 py-4 rounded-2xl bg-slate-900 border border-slate-700 text-white text-base font-medium placeholder:text-slate-500 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />

                {callingState === "idle" && (
                  <button
                    onClick={handleStartDemoClick}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>Call Me Now</span>
                  </button>
                )}

                {callingState === "calling" && (
                  <button
                    disabled
                    className="px-8 py-4 bg-slate-800 text-indigo-400 rounded-2xl font-bold text-sm flex items-center gap-2 shrink-0"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dialing...</span>
                  </button>
                )}

                {callingState === "connected" && (
                  <button
                    onClick={handleEndCall}
                    className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-red-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>End Demo Call</span>
                  </button>
                )}
              </div>
            </div>

            {callStatusMessage && (
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{callStatusMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lead Capture Info Form Popup Modal */}
      {showLeadPopup && (
        <LeadCapturePopup
          onSuccess={handleLeadSuccess}
          onCancel={() => setShowLeadPopup(false)}
        />
      )}
    </section>
  );
}
