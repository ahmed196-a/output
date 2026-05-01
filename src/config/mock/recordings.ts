import { Recording } from "@/types/recording";

export const recordingsMock: Recording[] = [
  {
    id: "rec_1001",
    callId: "cl_1001",
    agentName: "Sales Agent",
    customerNumber: "+353851002001",
    durationSeconds: 244,
    createdAt: "2026-04-09T09:18:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
  },
  {
    id: "rec_1003",
    callId: "cl_1003",
    agentName: "Booking Agent",
    customerNumber: "+353851002003",
    durationSeconds: 312,
    createdAt: "2026-04-09T10:08:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"
  },
  {
    id: "rec_1005",
    callId: "cl_1005",
    agentName: "Sales Agent",
    customerNumber: "+353851002005",
    durationSeconds: 218,
    createdAt: "2026-04-09T11:22:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"
  },
  {
    id: "rec_1007",
    callId: "cl_1007",
    agentName: "Booking Agent",
    customerNumber: "+353851002007",
    durationSeconds: 276,
    createdAt: "2026-04-10T09:10:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"
  },
  {
    id: "rec_1008",
    callId: "cl_1008",
    agentName: "Sales Agent",
    customerNumber: "+353851002008",
    durationSeconds: 183,
    createdAt: "2026-04-10T09:44:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"
  },
  {
    id: "rec_1010",
    callId: "cl_1010",
    agentName: "Booking Agent",
    customerNumber: "+353851002010",
    durationSeconds: 305,
    createdAt: "2026-04-10T10:31:00Z",
    audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"
  }
];
