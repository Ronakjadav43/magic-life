import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const comments = await prisma.comment.findMany({
      where: { taskId: id },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, initials: true, color: true } } },
    });
    return NextResponse.json(comments);
  } catch (error) {
    console.error(`GET /api/tasks/[id]/comments error:`, error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const comment = await prisma.comment.create({
      data: {
        taskId: id,
        userId: body.userId,
        comment: body.comment,
      },
      include: { user: { select: { id: true, name: true, initials: true, color: true } } },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error(`POST /api/tasks/[id]/comments error:`, error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
