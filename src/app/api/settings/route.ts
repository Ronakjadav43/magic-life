import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    const settings = await prisma.userSettings.findUnique({ where: { userId } });
    return NextResponse.json(settings || {
      dailyReminderTime: '10:00',
      overdueReminderTime: '09:00',
      whatsappNumber: '919723242591',
    });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }
    const settings = await prisma.userSettings.upsert({
      where: { userId: body.userId },
      update: {
        ...(body.dailyReminderTime !== undefined && { dailyReminderTime: body.dailyReminderTime }),
        ...(body.overdueReminderTime !== undefined && { overdueReminderTime: body.overdueReminderTime }),
        ...(body.whatsappNumber !== undefined && { whatsappNumber: body.whatsappNumber }),
      },
      create: {
        userId: body.userId,
        dailyReminderTime: body.dailyReminderTime || '10:00',
        overdueReminderTime: body.overdueReminderTime || '09:00',
        whatsappNumber: body.whatsappNumber || '919723242591',
      },
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error('PUT /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
