// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
    .select("id, email, full_name, role, tenant_id")
    .eq("id", payload.sub)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: user.role,
    tenantId: user.tenant_id,
  });
}

export async function PATCH(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { fullName, email, currentPassword, newPassword } = body;

  const supabase = createServerSupabaseClient();

  // Fetch current user
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("id", payload.sub)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Update name
  if (fullName && fullName.trim()) {
    updates.full_name = fullName.trim();
  }

  // Update email
  if (email && email.trim()) {
    const newEmail = email.toLowerCase().trim();
    if (newEmail !== user.email) {
      // Check email uniqueness
      const { data: existing } = await supabase
        .from("users")
        .select("id")
        .ilike("email", newEmail)
        .neq("id", user.id)
        .maybeSingle();
      if (existing) {
        return NextResponse.json({ error: "Email is already in use." }, { status: 409 });
      }
      updates.email = newEmail;
    }
  }

  // Update password
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password is required to set a new password." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
    }
    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }
    updates.password_hash = await bcrypt.hash(newPassword, 12);
  }

  const { error: updateError } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (updateError) {
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
