// src/app/api/user/change-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function POST(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both fields are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Fetch current hash
  const { data: user, error } = await supabase
    .from("users")
    .select("id, password_hash")
    .eq("id", payload.sub)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Verify current password
  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  // Hash new password and save
  const newHash = await bcrypt.hash(newPassword, 12);
  const { error: updateError } = await supabase
    .from("users")
    .update({ password_hash: newHash, updated_at: new Date().toISOString() })
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update password." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}