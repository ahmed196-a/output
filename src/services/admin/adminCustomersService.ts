import { AdminCustomer } from "@/types/admin/customer";

export type AdminCustomersParams = {
  search?: string;
  status?: "all" | "active" | "inactive";
};

export const adminCustomersService = {
  async getCustomers(params?: AdminCustomersParams): Promise<AdminCustomer[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.status && params.status !== "all") searchParams.set("status", params.status);

    const qs = searchParams.toString();
    const res = await fetch(`/api/admin/customers${qs ? `?${qs}` : ""}`);
    if (!res.ok) throw new Error("Failed to fetch customers.");
    return res.json();
  },
};