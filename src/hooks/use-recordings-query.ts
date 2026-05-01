import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Recording } from "@/types/recording";

export function useRecordingsQuery() {
  const [data, setData] = useState<Recording[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetch() {
      setIsLoading(true);
      const { data: rows, error: err } = await supabase
        .from("cdrs")
        .select("id, call_id, assistant_id, customer_number, total_seconds, start_datetime, call_recording")
        .not("call_recording", "is", null)
        .neq("call_recording", "")
        .order("start_datetime", { ascending: false });

      if (err) {
        setError(new Error(err.message));
      } else {
        setData(
          (rows ?? []).map((r) => ({
            id: r.id,
            callId: r.call_id ?? r.id,
            agentName: r.assistant_id ?? "Unknown",
            customerNumber: r.customer_number ?? "—",
            durationSeconds: r.total_seconds ?? 0,
            createdAt: r.start_datetime ?? "",
            audioUrl: r.call_recording,
          }))
        );
      }
      setIsLoading(false);
    }
    fetch();
  }, []);

  return { data, isLoading, error };
}
