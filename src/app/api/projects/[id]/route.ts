import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const project = await prisma.project.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.startDate !== undefined && { startDate: body.startDate }),
        ...(body.deadline !== undefined && { deadline: body.deadline }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.progress !== undefined && { progress: parseInt(body.progress) || 0 }),
        ...(body.revenue !== undefined && { revenue: parseFloat(body.revenue) || 0 }),
        ...(body.teamIds !== undefined && { teamIds: body.teamIds }),
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error('PUT /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/projects/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
