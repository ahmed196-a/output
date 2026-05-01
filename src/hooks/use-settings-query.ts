import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { settingsService } from "@/services/settings-service";

export function useAccountSettingsQuery() {
  return useQuery({
    queryKey: queryKeys.accountSettings,
    queryFn: settingsService.getAccountSettings
  });
}
