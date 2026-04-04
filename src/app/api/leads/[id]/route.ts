import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const lead = await prisma.lead.update({
      where: { id },
      data: {
        ...(body.date !== undefined && { date: body.date }),
        ...(body.clientName !== undefined && { clientName: body.clientName }),
        ...(body.platform !== undefined && { platform: body.platform }),
        ...(body.proposalSent !== undefined && { proposalSent: body.proposalSent }),
        ...(body.followUpDate !== undefined && { followUpDate: body.followUpDate }),
        ...(body.status !== undefined && { status: body.status }),
        ...(body.dealValue !== undefined && { dealValue: parseFloat(body.dealValue) || 0 }),
      },
    });
    return NextResponse.json(lead);
  } catch (error) {
    console.error('PUT /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/leads/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
  }
}
