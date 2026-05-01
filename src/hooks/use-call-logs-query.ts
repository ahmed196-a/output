import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CallLog } from "@/types/call-log";
import { useAuthStore } from "@/store/auth-store";

export function useCallLogsQuery() {
  const [data, setData] = useState<CallLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const user = useAuthStore((state) => state.user);
  const hydrated = useAuthStore((state) => state.hydrated);

  useEffect(() => {
    if (!hydrated) return; // wait until store is hydrated from storage

    async function fetchCallLogs() {
      setIsLoading(true);

      console.log("[Auth] hydrated:", hydrated);
      console.log("[Auth] user from store:", user);
      console.log("[Auth] user.id:", user?.id);

      let pricePerMinute: number | null = null;

      if (user?.id) {
        const { data: userRow } = await supabase
          .from("users")
          .select("active_subscription_id")
          .eq("id", user.id)
          .single();

        console.log("[Subscription] userRow:", userRow);

        if (userRow?.active_subscription_id) {
          console.log("[Subscription] ID:", userRow.active_subscription_id);

          const { data: subRow } = await supabase
            .from("subscriptions")
            .select("price_per_minute_snapshot")
            .eq("id", userRow.active_subscription_id)
            .single();

          console.log("[Subscription] subRow:", subRow);

          if (subRow) {
            pricePerMinute = Number(subRow.price_per_minute_snapshot);
            console.log("[Subscription] price_per_minute:", pricePerMinute);
          }
        } else {
          console.warn("[Subscription] No active_subscription_id for user:", user.id);
        }
      } else {
        console.warn("[Auth] No user in store after hydration.");
      }

      // Fetch CDRs
      const { data: rows, error: fetchError } = await supabase
        .from("cdrs")
        .select("*")
        .order("start_datetime", { ascending: true });

      if (fetchError) {
        console.error("Supabase error:", fetchError);
        setError(new Error(fetchError.message));
      } else {
        setData(
          (rows ?? []).map((row) => {
            const durationSeconds =
              row.total_seconds ?? Math.round(Number(row.total_mins ?? 0) * 60);
            const billableMinutes = durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : 0;

            let computedCost: number | null = null;
            if (pricePerMinute !== null && durationSeconds > 0) {
              computedCost = Math.round(billableMinutes * pricePerMinute * 100) / 100;
              console.log(
                `[Call Cost] call_id=${row.call_id} | ` +
                `total_seconds=${row.total_seconds} | total_mins=${row.total_mins} | ` +
                `billable_minutes=${billableMinutes} | ` +
                `price_per_minute=${pricePerMinute} | ` +
                `computed_cost=$${computedCost.toFixed(2)}`
              );
            }

            return {
              id: row.id,
              callId: row.call_id ?? row.id,
              startedAt: row.start_datetime ?? "",
              endedAt: row.end_datetime ?? null,
              fromNumber: row.customer_number ?? "—",
              toNumber: row.assistant_id ?? "—",
              durationSeconds,
              status: row.is_successful === true ? "passed" : "failed",
              agentName: row.assistant_id ?? "Unknown",
              hasRecording: Boolean(row.call_recording),
              recordingUrl: row.call_recording ?? null,
              cost: computedCost,
              transcript: row.transcript ?? null,
              disconnectionReason: row.disconnection_reason ?? null,
              callInfo: row.call_info ?? null,
              customerSentiment: row.customer_sentiment ?? null,
              isSuccessful: row.is_successful ?? null,
            };
          })
        );
      }

      setIsLoading(false);
    }

    fetchCallLogs();
  }, [hydrated, user]); // re-runs when hydration completes or user changes

  return { data, isLoading, error };
}