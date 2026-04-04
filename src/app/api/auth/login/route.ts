import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'magic-life-ops-secret-key-2026');

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 401 });
    }

    if (!user.active) {
      return NextResponse.json({ success: false, error: 'Account is deactivated' }, { status: 401 });
    }

    const bcrypt = await import('bcryptjs');
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
    }

    const token = await new SignJWT({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      initials: user.initials,
      color: user.color,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(JWT_SECRET);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        initials: user.initials,
        color: user.color,
      },
    });
  } catch (error) {
    console.error('POST /api/auth/login error:', error);
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 });
  }
}
