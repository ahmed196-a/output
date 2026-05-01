import { DashboardSummary } from "@/types/dashboard";
import { CallLog } from "@/types/call-log";
import { Recording } from "@/types/recording";
import { Invoice } from "@/types/billing";

export const dashboardSummaryMock: DashboardSummary = {
  kpis: [
    { label: "Total Calls", value: "14,208", change: "+8.1%" },
    { label: "Answered Calls", value: "11,632", change: "+5.4%" },
    { label: "Missed Calls", value: "1,025", change: "-2.2%" },
    { label: "Failed Calls", value: "351", change: "-1.1%" },
    { label: "Active AI Agents", value: "8", change: "+2" },
    { label: "Total Minutes Used", value: "28,904", change: "+6.7%" }
  ],
  trends: [
    { date: "Mon", totalCalls: 520, answeredCalls: 450, missedCalls: 52 },
    { date: "Tue", totalCalls: 610, answeredCalls: 533, missedCalls: 49 },
    { date: "Wed", totalCalls: 742, answeredCalls: 654, missedCalls: 58 },
    { date: "Thu", totalCalls: 680, answeredCalls: 595, missedCalls: 61 },
    { date: "Fri", totalCalls: 790, answeredCalls: 702, missedCalls: 63 },
    { date: "Sat", totalCalls: 580, answeredCalls: 516, missedCalls: 42 },
    { date: "Sun", totalCalls: 540, answeredCalls: 478, missedCalls: 38 }
  ],
  agentPerformance: [
    { agentName: "Sales Agent", successRate: 92, avgDurationSeconds: 189 },
    { agentName: "Support Agent", successRate: 88, avgDurationSeconds: 243 },
    { agentName: "Booking Agent", successRate: 95, avgDurationSeconds: 156 },
    { agentName: "Renewal Agent", successRate: 90, avgDurationSeconds: 211 }
  ]
};

export const recentCallLogsMock: CallLog[] = [
  {
    id: "cl_001",
    startedAt: "2026-04-10T09:14:00Z",
    fromNumber: "+353851112233",
    toNumber: "+35319123456",
    durationSeconds: 244,
    status: "answered",
    agentName: "Sales Agent",
    hasRecording: true
  },
  {
    id: "cl_002",
    startedAt: "2026-04-10T09:28:00Z",
    fromNumber: "+353861114455",
    toNumber: "+35319123456",
    durationSeconds: 0,
    status: "missed",
    agentName: "Support Agent",
    hasRecording: false
  },
  {
    id: "cl_003",
    startedAt: "2026-04-10T10:02:00Z",
    fromNumber: "+353871116677",
    toNumber: "+35319123456",
    durationSeconds: 301,
    status: "answered",
    agentName: "Booking Agent",
    hasRecording: true
  },
  {
    id: "cl_004",
    startedAt: "2026-04-10T10:11:00Z",
    fromNumber: "+353891118899",
    toNumber: "+35319123456",
    durationSeconds: 14,
    status: "failed",
    agentName: "Renewal Agent",
    hasRecording: false
  }
];

export const recentRecordingsMock: Recording[] = [
  {
    id: "rec_001",
    callId: "cl_001",
    agentName: "Sales Agent",
    customerNumber: "+353851112233",
    durationSeconds: 244,
    createdAt: "2026-04-10T09:18:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "rec_002",
    callId: "cl_003",
    agentName: "Booking Agent",
    customerNumber: "+353871116677",
    durationSeconds: 301,
    createdAt: "2026-04-10T10:07:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  }
];

export const invoiceSummaryMock: Invoice[] = [
  {
    id: "inv_0301",
    period: "Mar 2026",
    amount: "EUR 2,340.00",
    status: "paid",
    issuedAt: "2026-04-01"
  },
  {
    id: "inv_0201",
    period: "Feb 2026",
    amount: "EUR 2,110.00",
    status: "paid",
    issuedAt: "2026-03-01"
  }
];
