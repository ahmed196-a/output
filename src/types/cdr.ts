import { CallStatus } from "@/types/call-log";

export type CdrEntry = {
  callId: string;
  carrier: "telnyx" | "retell" | "other";
  direction: "inbound" | "outbound";
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  from: string;
  to: string;
  status: CallStatus;
  cost: number;
  currency: string;
};
