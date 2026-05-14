import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { CallLog } from "@/types/call-log";
import { DateRangeParams, PaginationParams } from "@/types/common";
import { CdrEntry } from "@/types/cdr";
import { supabase } from "@/lib/supabase";

export type CallLogsParams = PaginationParams &
  DateRangeParams & {
    search?: string;
    status?: CallLog["status"] ;
    agent?: string;
  };

export const callLogsService = {
  async getCallLogs(params?: CallLogsParams): Promise<CallLog[]> {
    return requestWithFallback<CallLog[]>({
      request: async () => {
        const response = await apiClient.get<CallLog[]>(API_ENDPOINTS.callLogs.list, { params });
        return response.data;
      },
      fallback: () => []
    });
  },
 
  async getCdrEntries(): Promise<CdrEntry[]> {
  // 1. Get the tables this user can access
  const { data: accessRows } = await supabase
    .from("user_cdr_access")
    .select("cdr_table_id");

  if (!accessRows || accessRows.length === 0) return [];

  // 2. Resolve table names
  const tableIds = accessRows.map((r) => r.cdr_table_id);
  const { data: tableRows } = await supabase
    .from("cdr_tables")
    .select("table_name")
    .in("id", tableIds);

  if (!tableRows) return [];

  // 3. Query each allowed table and merge results
  const results = await Promise.all(
    tableRows.map(async (t) => {
      const { data } = await supabase
        .from(t.table_name)
        .select("*")
        .order("start_datetime", { ascending: false })
        .limit(500);
      return (data ?? []) as CdrEntry[];
    })
  );

  return results.flat();
}
};
