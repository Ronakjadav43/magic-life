import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('GET /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const lead = await prisma.lead.create({
      data: {
        date: body.date,
        clientName: body.clientName,
        platform: body.platform,
        proposalSent: body.proposalSent || false,
        followUpDate: body.followUpDate || '',
        status: body.status || 'New',
        dealValue: parseFloat(body.dealValue) || 0,
      },
    });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('POST /api/leads error:', error);
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
  }
}
