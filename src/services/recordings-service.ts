import { recordingsMock } from "@/config/mock/recordings";
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { DateRangeParams, PaginationParams } from "@/types/common";
import { Recording } from "@/types/recording";

export type RecordingsParams = PaginationParams &
  DateRangeParams & {
    search?: string;
    agent?: string;
  };

export const recordingsService = {
  async getRecordings(params?: RecordingsParams): Promise<Recording[]> {
    return requestWithFallback<Recording[]>({
      request: async () => {
        const response = await apiClient.get<Recording[]>(API_ENDPOINTS.recordings.list, { params });
        return response.data;
      },
      fallback: () => recordingsMock
    });
  }
};
