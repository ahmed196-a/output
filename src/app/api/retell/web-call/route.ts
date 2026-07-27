import { NextRequest, NextResponse } from 'next/server';
import { createRetellWebCall } from '@/lib/retell-api';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId } = body;

    if (!agentId) {
      return NextResponse.json({ message: 'agentId is required' }, { status: 400 });
    }

    const webCallData = await createRetellWebCall(agentId);
    return NextResponse.json(webCallData);
  } catch (error: any) {
    console.error('[API /retell/web-call Error]', error);
    return NextResponse.json(
      { message: error.message || 'Failed to start web call test session' },
      { status: 500 }
    );
  }
}
