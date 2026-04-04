import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const entries = await prisma.dailyEntry.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignee: { select: { id: true, name: true, initials: true, color: true } } },
    });
    return NextResponse.json(entries);
  } catch (error) {
    console.error('GET /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to fetch entries' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const entry = await prisma.dailyEntry.create({
      data: {
        date: body.date,
        taskName: body.taskName,
        category: body.category,
        projectId: body.projectId || null,
        timeSpent: parseFloat(body.timeSpent) || 0,
        status: body.status || 'Pending',
        notes: body.notes || '',
        assigneeId: body.assigneeId || null,
        approval: body.approval || 'Not Submitted',
        approvedBy: body.approvedBy || null,
        approvalNote: body.approvalNote || null,
      },
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error('POST /api/entries error:', error);
    return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
  }
}
