export type CallStatus = "passed" | "failed";

export type CallLog = {
  id: string;
  callId: string;
  startedAt: string;
  endedAt: string | null;
  fromNumber: string;
  toNumber: string;
  durationSeconds: number;
  status: CallStatus;
  agentName: string;
  hasRecording: boolean;
  recordingUrl: string | null;
  cost: number | null;
  transcript: string | null;
  disconnectionReason: string | null;
  callInfo: string | null;
  customerSentiment: string | null;
  isSuccessful: boolean | null;
};
