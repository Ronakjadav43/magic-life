import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const taskData = await prisma.task.findUnique({ where: { id } });
    if (!taskData) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const data: any = {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.dueDate !== undefined && { dueDate: body.dueDate }),
      ...(body.projectId !== undefined && { projectId: body.projectId || null }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.assigneeId !== undefined && { assigneeId: body.assigneeId || null }),
    };

    if (body.status && body.status !== taskData.status) {
      data.activities = {
        create: {
          action: 'moved',
          oldStatus: taskData.status,
          newStatus: body.status,
          userId: body.userId || body.assigneeId || taskData.assigneeId || null,
        }
      };
    }

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        activities: true
      }
    });
    return NextResponse.json(task);
  } catch (error) {
    console.error('PUT /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/tasks/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
