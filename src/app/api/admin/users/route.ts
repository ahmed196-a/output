import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, tenant_id, created_at, is_active")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("[/api/admin/users]", err);
    return NextResponse.json({ error: "Failed to fetch users." }, { status: 500 });
  }
}