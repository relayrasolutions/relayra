import { NextResponse } from 'next/server';

// Deprecated: Use /api/ai/generate-message instead
export async function POST() {
  return NextResponse.json(
    { error: 'This endpoint is deprecated. Use /api/ai/generate-message instead.' },
    { status: 410 }
  );
}
