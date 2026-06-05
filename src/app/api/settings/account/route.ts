// src/app/api/settings/account/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, full_name, tenant_id")
    .eq("id", payload.sub)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      fullName: user.full_name,
      email: user.email,
      timezone: "UTC",
    },
    company: {
      companyName: user.tenant_id ?? "",
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: false,
      weeklyReports: true,
    },
  });
}
