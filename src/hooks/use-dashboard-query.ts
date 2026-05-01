import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CallLog } from "@/types/call-log";
import { Recording } from "@/types/recording";
import { TrendPoint, AgentPerformancePoint, DashboardKpi } from "@/types/dashboard";

export type DashboardOverview = {
  kpis: DashboardKpi[];
  trends: TrendPoint[];
  agentPerformance: AgentPerformancePoint[];
  recentCallLogs: CallLog[];
  recentRecordings: Recording[];
};

function formatDateSafe(raw: string | null | undefined): string {
  if (!raw) return "—";
  const ts = Number(raw);
  const d = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function toDateLabel(raw: string | null | undefined): string {
  if (!raw) return "—";
  const ts = Number(raw);
  const d = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

export function useDashboardOverviewQuery() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      try {
        // Fetch all CDR rows needed for stats
        const { data: rows, error: err } = await supabase
          .from("cdrs")
          .select("*")
          .order("start_datetime", { ascending: false });

        if (err) throw new Error(err.message);

        const all = rows ?? [];

        // ── KPIs ──────────────────────────────────────────────────────────────
        const totalCalls = all.length;
        const succeededCalls = all.filter((r) => r.is_successful === true).length;
        const failedCalls = all.filter((r) => r.is_successful === false).length;
        const distinctAgents = new Set(all.map((r) => r.assistant_id).filter(Boolean)).size;
        const totalMinutes = all.reduce((acc, r) => acc + (r.total_mins ?? 0), 0);

        const kpis: DashboardKpi[] = [
          { label: "Total Calls", value: totalCalls.toLocaleString() },
          { label: "Succeeded Calls", value: succeededCalls.toLocaleString() },
          { label: "Failed Calls", value: failedCalls.toLocaleString() },
          { label: "Active AI Agents", value: distinctAgents.toLocaleString() },
          { label: "Total Minutes Used", value: totalMinutes.toFixed(1) },
        ];

        // ── Trends: last 7 days ───────────────────────────────────────────────
        const today = new Date();
        const trendsMap: Record<string, { total: number; answered: number; missed: number }> = {};
        for (let i = 6; i >= 0; i--) {
          const d = new Date(today);
          d.setDate(today.getDate() - i);
          const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          trendsMap[label] = { total: 0, answered: 0, missed: 0 };
        }

        all.forEach((r) => {
          const ts = Number(r.start_datetime);
          const d = isNaN(ts) ? new Date(r.start_datetime) : new Date(ts);
          if (isNaN(d.getTime())) return;
          const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
          if (diff > 6 || diff < 0) return;
          const label = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
          if (!trendsMap[label]) return;
          trendsMap[label].total++;
          if (r.is_successful === true) trendsMap[label].answered++;
          if (r.is_successful === false) trendsMap[label].missed++;
        });

        const trends: TrendPoint[] = Object.entries(trendsMap).map(([date, v]) => ({
          date,
          totalCalls: v.total,
          answeredCalls: v.answered,
          missedCalls: v.missed,
        }));

        // ── Agent Performance ─────────────────────────────────────────────────
        const agentMap: Record<string, { total: number; success: number; durations: number[] }> = {};
        all.forEach((r) => {
          const id = r.assistant_id ?? "Unknown";
          if (!agentMap[id]) agentMap[id] = { total: 0, success: 0, durations: [] };
          agentMap[id].total++;
          if (r.is_successful === true) agentMap[id].success++;
          if (r.total_seconds) agentMap[id].durations.push(r.total_seconds);
        });

        const agentPerformance: AgentPerformancePoint[] = Object.entries(agentMap)
          .map(([id, v]) => ({
            agentName: id.length > 16 ? id.slice(0, 14) + "…" : id,
            successRate: v.total > 0 ? Math.round((v.success / v.total) * 100) : 0,
            avgDurationSeconds:
              v.durations.length > 0
                ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length)
                : 0,
          }))
          .slice(0, 8); // cap at 8 agents for chart readability

        // ── Recent Call Logs (last 5) ─────────────────────────────────────────
        const recentCallLogs: CallLog[] = [...all.slice(0, 5)].reverse().map((r) => ({
          id: r.id,
          callId: r.call_id ?? r.id,
          startedAt: r.start_datetime ?? "",
          endedAt: r.end_datetime ?? null,
          fromNumber: r.customer_number ?? "—",
          toNumber: r.assistant_id ?? "—",
          durationSeconds: r.total_seconds ?? 0,
          status:
            r.is_successful === true ? "passed" : r.is_successful === false ? "failed" : "missed",
          agentName: r.assistant_id ?? "Unknown",
          hasRecording: Boolean(r.call_recording),
          recordingUrl: r.call_recording ?? null,
          cost: r.total_mins ?? null,
          transcript: r.transcript ?? null,
          disconnectionReason: r.disconnection_reason ?? null,
          callInfo: r.call_info ?? null,
          customerSentiment: r.customer_sentiment ?? null,
          isSuccessful: r.is_successful ?? null,
        }));

        // ── Recent Recordings (last 2 with a recording URL) ───────────────────
        const withRecording = all.filter((r) => Boolean(r.call_recording));
        const recentRecordings: Recording[] = withRecording.slice(0, 2).map((r) => ({
          id: r.id,
          callId: r.call_id ?? r.id,
          agentName: r.assistant_id ?? "Unknown",
          customerNumber: r.customer_number ?? "—",
          durationSeconds: r.total_seconds ?? 0,
          createdAt: r.start_datetime ?? "",
          audioUrl: r.call_recording,
        }));

        setData({ kpis, trends, agentPerformance, recentCallLogs, recentRecordings });
      } catch (e) {
        setError(e instanceof Error ? e : new Error("Unknown error"));
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, []);

  return { data, isLoading, error };
}
