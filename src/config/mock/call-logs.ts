import { CallLog } from "@/types/call-log";

export const callLogsMock: CallLog[] = [
  {
    id: "cl_1001",
    startedAt: "2026-04-09T09:14:00Z",
    fromNumber: "+353851002001",
    toNumber: "+35319123456",
    durationSeconds: 244,
    status: "answered",
    agentName: "Sales Agent",
    hasRecording: true
  },
  {
    id: "cl_1002",
    startedAt: "2026-04-09T09:33:00Z",
    fromNumber: "+353851002002",
    toNumber: "+35319123457",
    durationSeconds: 0,
    status: "missed",
    agentName: "Support Agent",
    hasRecording: false
  },
  {
    id: "cl_1003",
    startedAt: "2026-04-09T10:02:00Z",
    fromNumber: "+353851002003",
    toNumber: "+35319123458",
    durationSeconds: 312,
    status: "answered",
    agentName: "Booking Agent",
    hasRecording: true
  },
  {
    id: "cl_1004",
    startedAt: "2026-04-09T10:29:00Z",
    fromNumber: "+353851002004",
    toNumber: "+35319123459",
    durationSeconds: 11,
    status: "failed",
    agentName: "Renewal Agent",
    hasRecording: false
  },
  {
    id: "cl_1005",
    startedAt: "2026-04-09T11:18:00Z",
    fromNumber: "+353851002005",
    toNumber: "+35319123456",
    durationSeconds: 218,
    status: "answered",
    agentName: "Sales Agent",
    hasRecording: true
  },
  {
    id: "cl_1006",
    startedAt: "2026-04-10T08:51:00Z",
    fromNumber: "+353851002006",
    toNumber: "+35319123457",
    durationSeconds: 0,
    status: "missed",
    agentName: "Support Agent",
    hasRecording: false
  },
  {
    id: "cl_1007",
    startedAt: "2026-04-10T09:05:00Z",
    fromNumber: "+353851002007",
    toNumber: "+35319123458",
    durationSeconds: 276,
    status: "answered",
    agentName: "Booking Agent",
    hasRecording: true
  },
  {
    id: "cl_1008",
    startedAt: "2026-04-10T09:40:00Z",
    fromNumber: "+353851002008",
    toNumber: "+35319123456",
    durationSeconds: 183,
    status: "answered",
    agentName: "Sales Agent",
    hasRecording: true
  },
  {
    id: "cl_1009",
    startedAt: "2026-04-10T10:12:00Z",
    fromNumber: "+353851002009",
    toNumber: "+35319123457",
    durationSeconds: 26,
    status: "failed",
    agentName: "Support Agent",
    hasRecording: false
  },
  {
    id: "cl_1010",
    startedAt: "2026-04-10T10:27:00Z",
    fromNumber: "+353851002010",
    toNumber: "+35319123458",
    durationSeconds: 305,
    status: "answered",
    agentName: "Booking Agent",
    hasRecording: true
  }
];
