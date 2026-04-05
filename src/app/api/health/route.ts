import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Simple query to test DB connectivity
    const result = await prisma.$queryRaw<[{ now: Date }]>`SELECT NOW() as now`;
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: result[0].now,
      provider: 'supabase',
    });
  } catch (error) {
    console.error('DB health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 503 }
    );
  }
}
