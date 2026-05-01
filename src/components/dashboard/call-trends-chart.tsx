"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { TrendPoint } from "@/types/dashboard";

type CallTrendsChartProps = {
  data: TrendPoint[];
};

export function CallTrendsChart({ data }: CallTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Line type="monotone" dataKey="totalCalls" stroke="#0f172a" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="answeredCalls" stroke="#0ea5e9" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
