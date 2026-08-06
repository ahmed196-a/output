import { NextRequest, NextResponse } from "next/server";
import { listKnowledgeBases, createKnowledgeBase } from "@/lib/retell-api";

export async function GET(req: NextRequest) {
  try {
    const kbs = await listKnowledgeBases({ skipCache: true });
    return NextResponse.json(kbs);
  } catch (error: any) {
    console.error("[GET /api/retell/knowledge-bases]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch knowledge bases from Retell AI" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      knowledge_base_name,
      texts,
      urls,
      files,
      knowledge_base_texts,
      knowledge_base_urls,
      knowledge_base_files,
    } = body;

    if (!knowledge_base_name) {
      return NextResponse.json(
        { error: "knowledge_base_name is required" },
        { status: 400 }
      );
    }

    const kb = await createKnowledgeBase({
      knowledge_base_name,
      texts,
      urls,
      files,
      knowledge_base_texts,
      knowledge_base_urls,
      knowledge_base_files,
    });

    return NextResponse.json(kb, { status: 201 });
  } catch (error: any) {
    console.error("[POST /api/retell/knowledge-bases]", error);
    return NextResponse.json(
      { error: error.message || "Failed to create Knowledge Base on Retell AI" },
      { status: error.status || 500 }
    );
  }
}
