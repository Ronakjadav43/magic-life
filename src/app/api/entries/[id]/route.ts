import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const entry = await prisma.dailyEntry.update({
      where: { id },
      data: {
        ...(body.date !== undefined && { date: body.date }),
        ...(body.taskName !== undefined && { taskName: body.taskName }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.projectId !== undefined && { projectId: body.projectId || null }),
        ...(body.taskId !== undefined && { taskId: body.taskId || null }),
        ...(body.linkedTaskIds !== undefined && { linkedTaskIds: body.linkedTaskIds }),
        ...(body.timeSpent !== undefined && { timeSpent: parseFloat(body.timeSpent) || 0 }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.notes !== undefined && { notes: body.notes }),
        ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId || null }),
        ...(body.approval !== undefined && { approval: body.approval }),
        ...(body.approvedBy !== undefined && { approvedBy: body.approvedBy }),
        ...(body.approvalNote !== undefined && { approvalNote: body.approvalNote }),
      },
    });
    return NextResponse.json(entry);
  } catch (error) {
    console.error('PUT /api/entries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.dailyEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/entries/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
  }
}
