import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { agentsService } from "@/services/agents-service";
import { formatDuration } from "@/utils/format";
import { getAgentStatusVariant } from "@/utils/status";

type AgentDetailPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = await params;
  const agent = await agentsService.getAgentById(agentId);

  if (!agent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={agent.name}
        description="Individual AI agent details, operational status, and performance summary."
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Calls" value={String(agent.totalCalls)} />
        <StatCard label="Answer Rate" value={`${agent.answerRate}%`} />
        <StatCard label="Avg Duration" value={formatDuration(agent.avgDurationSeconds)} />
      </section>

      <section className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">Agent Configuration</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p>
            <span className="font-medium text-slate-900">Agent ID:</span> {agent.id}
          </p>
          <p>
            <span className="font-medium text-slate-900">Phone Number:</span> {agent.phoneNumber}
          </p>
          <p className="flex items-center gap-2">
            <span className="font-medium text-slate-900">Status:</span>
            <StatusBadge text={agent.status} variant={getAgentStatusVariant(agent.status)} />
          </p>
          <p className="flex items-center gap-2">
            <span className="font-medium text-slate-900">Campaign:</span>
            <StatusBadge text={agent.campaignStatus} variant="neutral" />
          </p>
        </div>
      </section>
    </div>
  );
}
