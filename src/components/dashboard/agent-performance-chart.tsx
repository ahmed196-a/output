"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AgentPerformancePoint } from "@/types/dashboard";

type AgentPerformanceChartProps = {
  data: AgentPerformancePoint[];
};

export function AgentPerformanceChart({ data }: AgentPerformanceChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="agentName" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Bar dataKey="successRate" fill="#0f172a" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
