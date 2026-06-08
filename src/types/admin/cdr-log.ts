export type AdminCdrLog = {
  id: string;
  callId: string;
  startedAt: string;
  endedAt: string | null;
  fromNumber: string;
  toNumber: string;
  durationSeconds: number;
  status: "passed" | "failed";
  hasRecording: boolean;
  recordingUrl: string | null;
  transcript: string | null;
  disconnectionReason: string | null;
  callInfo: string | null;
  customerSentiment: string | null;
  isSuccessful: boolean | null;
  customerId: string | null;
  customerName: string | null;
  customerEmail: string | null;
};

export type AdminCdrCustomer = {
  id: string;
  fullName: string;
  email: string;
};

export type AdminCdrLogsParams = {
  customer_id?: string;
  status?: string;
  from?: string;
  to?: string;
  sort?: "newest" | "oldest";
  search?: string;
  page?: number;
  limit?: number;
};

export type AdminCdrLogsResponse = {
  data: AdminCdrLog[];
  total: number;
  page: number;
  limit: number;
  customers: AdminCdrCustomer[];
};
