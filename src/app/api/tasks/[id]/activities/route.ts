import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const activities = await prisma.taskActivity.findMany({
      where: { taskId: id },
      orderBy: { timestamp: 'desc' },
      include: { user: { select: { id: true, name: true, initials: true, color: true } } },
    });
    return NextResponse.json(activities);
  } catch (error) {
    console.error(`GET /api/tasks/${params}/activities error:`, error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}
