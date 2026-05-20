"use client";

import { Phone, Clock, DollarSign, TrendingUp, Bot, RefreshCw, Loader2, AlertCircle } from "lucide-react";
import { useAdminAgentsAnalyticsQuery } from "@/hooks/admin/use-admin-retell-agents-query";
import { AgentAnalytics } from "@/types/retell";
import { cn } from "@/lib/utils";

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function AgentRow({ agent, rank }: { agent: AgentAnalytics; rank: number }) {
  const maxCalls = 100; // for bar width calculation — relative
  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 font-medium">
            {rank}
          </span>
          <div>
            <p className="text-sm font-medium text-slate-900">{agent.agent_name}</p>
            <p className="text-xs text-slate-400 font-mono">{agent.retell_agent_id.slice(0, 20)}…</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 text-center">{agent.total_calls}</td>
      <td className="px-4 py-3 text-sm text-slate-700 text-center">{agent.completed_calls}</td>
      <td className="px-4 py-3 text-sm text-slate-700 text-center">
        {Math.floor(agent.avg_duration_seconds / 60)}m {agent.avg_duration_seconds % 60}s
      </td>
      <td className="px-4 py-3 text-center">
        <span className={cn(
          "rounded-full px-2 py-0.5 text-xs font-medium",
          agent.success_rate >= 80 ? "bg-green-100 text-green-700"
            : agent.success_rate >= 50 ? "bg-yellow-100 text-yellow-700"
            : "bg-red-100 text-red-700"
        )}>
          {agent.success_rate}%
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-slate-700 text-center">
        ${agent.total_cost.toFixed(4)}
      </td>
    </tr>
  );
}

function formatDurationFriendly(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function AdminAgentsAnalyticsShell() {
  const { data, isLoading, error, refetch, isRefetching } = useAdminAgentsAnalyticsQuery();

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Agents Analytics</h1>
          <p className="mt-1 text-sm text-slate-500">Real-time insights from Retell call data. Auto-refreshes every 30s.</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-600">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="text-sm underline text-slate-500">Retry</button>
        </div>
      ) : data ? (
        <>
          {/* Overview stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total Calls"
              value={data.total_calls.toLocaleString()}
              sub={`${data.ongoing_calls} currently active`}
              icon={Phone}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              label="Completed Calls"
              value={data.completed_calls.toLocaleString()}
              sub={`${data.total_calls > 0 ? Math.round((data.completed_calls / data.total_calls) * 100) : 0}% completion rate`}
              icon={TrendingUp}
              color="bg-green-50 text-green-600"
            />
            <StatCard
              label="Total Talk Time"
              value={formatDurationFriendly(data.total_duration_seconds)}
              sub={`${data.per_agent.length} active agents`}
              icon={Clock}
              color="bg-purple-50 text-purple-600"
            />
            <StatCard
              label="Total Cost"
              value={`$${data.total_cost.toFixed(4)}`}
              sub="USD via Retell"
              icon={DollarSign}
              color="bg-amber-50 text-amber-600"
            />
          </div>

          {/* Per-agent breakdown */}
          {data.per_agent.length > 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center gap-2 border-b px-5 py-4">
                <Bot className="h-4 w-4 text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-900">Per-Agent Breakdown</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-slate-50 text-left">
                      <th className="py-3 pl-5 pr-4 font-medium text-slate-600">Agent</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-center">Total Calls</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-center">Completed</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-center">Avg Duration</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-center">Success Rate</th>
                      <th className="px-4 py-3 font-medium text-slate-600 text-center">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="pl-5">
                    {data.per_agent.map((agent, i) => (
                      <AgentRow key={agent.agent_id} agent={agent} rank={i + 1} />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-16 text-center">
              <Bot className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-400">No call data yet. Calls will appear here after Retell sends webhook events.</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
