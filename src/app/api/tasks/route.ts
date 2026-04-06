import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: { createdAt: 'desc' },
      include: { assignee: { select: { id: true, name: true, initials: true, color: true } } },
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description || '',
        priority: body.priority || 'Medium',
        dueDate: body.dueDate || '',
        projectId: body.projectId || null,
        status: body.status || 'backlog',
        assigneeId: body.assigneeId || null,
        activities: {
          create: {
            action: 'created',
            newStatus: body.status || 'backlog',
            userId: body.assigneeId || null,
          }
        }
      },
      include: {
        activities: true,
      }
    });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
