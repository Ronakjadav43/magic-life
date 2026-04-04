import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) {
      updateData.name = body.name;
      updateData.initials = (body.name as string).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    }
    if (body.email !== undefined) updateData.email = body.email;
    if (body.role !== undefined) updateData.role = body.role;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.color !== undefined) updateData.color = body.color;

    if (body.password) {
      const bcrypt = await import('bcryptjs');
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        initials: true,
        color: true,
        active: true,
        createdAt: true,
      },
    });
    return NextResponse.json(user);
  } catch (error) {
    console.error('PUT /api/staff/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/staff/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete staff member' }, { status: 500 });
  }
}
