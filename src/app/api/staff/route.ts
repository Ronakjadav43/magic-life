import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const staff = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
    return NextResponse.json(staff);
  } catch (error) {
    console.error('GET /api/staff error:', error);
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const bcrypt = await import('bcryptjs');
    const hashedPassword = await bcrypt.hash(body.password || 'password123', 10);

    const initials = (body.name as string).split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
    const colors = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#22c55e', '#14b8a6', '#3b82f6'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || 'Staff',
        initials,
        color,
        active: body.active !== undefined ? body.active : true,
      },
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
    return NextResponse.json(user, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/staff error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to create staff';
    if (errMsg.includes('Unique constraint')) {
      return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
  }
}
