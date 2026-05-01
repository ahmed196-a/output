import { Agent } from "@/types/agent";

export const agentsMock: Agent[] = [
  {
    id: "agt_sales_01",
    name: "Sales Agent",
    status: "active",
    phoneNumber: "+35319123456",
    campaignStatus: "running",
    totalCalls: 4231,
    answerRate: 92,
    avgDurationSeconds: 189
  },
  {
    id: "agt_support_01",
    name: "Support Agent",
    status: "active",
    phoneNumber: "+35319123457",
    campaignStatus: "running",
    totalCalls: 3894,
    answerRate: 88,
    avgDurationSeconds: 243
  },
  {
    id: "agt_booking_01",
    name: "Booking Agent",
    status: "active",
    phoneNumber: "+35319123458",
    campaignStatus: "idle",
    totalCalls: 2671,
    answerRate: 95,
    avgDurationSeconds: 156
  },
  {
    id: "agt_renewal_01",
    name: "Renewal Agent",
    status: "paused",
    phoneNumber: "+35319123459",
    campaignStatus: "stopped",
    totalCalls: 1984,
    answerRate: 84,
    avgDurationSeconds: 204
  },
  {
    id: "agt_intake_01",
    name: "Intake Agent",
    status: "draft",
    phoneNumber: "+35319123460",
    campaignStatus: "idle",
    totalCalls: 0,
    answerRate: 0,
    avgDurationSeconds: 0
  }
];
