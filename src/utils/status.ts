import { AgentStatus } from "@/types/agent";
import { InvoiceStatus } from "@/types/billing";
import { CallStatus } from "@/types/call-log";
import { StatusVariant } from "@/components/shared/status-badge";

export function getCallStatusVariant(status: CallStatus): StatusVariant {
  if (status === "passed") {
    return "success";
  }
  if (status === "failed") {
    return "danger";
  }
  return "warning";
}

export function getAgentStatusVariant(status: AgentStatus): StatusVariant {
  if (status === "active") {
    return "success";
  }
  if (status === "paused") {
    return "warning";
  }
  return "neutral";
}

export function getInvoiceStatusVariant(status: InvoiceStatus): StatusVariant {
  if (status === "paid") {
    return "success";
  }
  if (status === "failed") {
    return "danger";
  }
  return "warning";
}
