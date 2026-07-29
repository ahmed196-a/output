import { NextResponse } from "next/server";
import { listKnowledgeBases, createKnowledgeBase } from "@/lib/retell-api";
import { createKbSchema } from "@/lib/validations/retell";

export async function GET(request: Request) {
  try {
    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const kbs = await listKnowledgeBases({ correlationId });
    return NextResponse.json(kbs);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to list Knowledge Bases" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = createKbSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.format() }, { status: 400 });
    }

    const correlationId = request.headers.get("x-correlation-id") || undefined;
    const result = await createKnowledgeBase(validation.data, { correlationId });
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create Knowledge Base" },
      { status: error.status || 500 }
    );
  }
}
