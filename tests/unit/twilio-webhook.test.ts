import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { POST } from '@/app/api/webhooks/twilio/message-status/route';
import { NextRequest } from 'next/server';

function createRequest(bodyParams: Record<string, string>, signature?: string) {
  const body = new URLSearchParams(bodyParams).toString();
  const headers = new Headers();
  if (signature) headers.set('x-twilio-signature', signature);
  
  return new NextRequest('http://localhost:3000/api/webhooks/twilio/message-status', {
    method: 'POST',
    headers,
    body
  });
}

describe('Twilio Message Status Webhook', () => {
  let workspace: any;
  let lead: any;
  let booking: any;

  beforeEach(async () => {
    process.env.TWILIO_WEBHOOK_SIGNING_KEY = 'test-secret';
    
    workspace = await prisma.workspace.create({ data: { name: 'Test WS' } });
    const company = await prisma.company.create({
      data: { workspaceId: workspace.id, name: 'Test Co', domain: 'test.com', industry: 'A', size: 'B', location: 'C' }
    });
    lead = await prisma.lead.create({
      data: { workspaceId: workspace.id, companyId: company.id, name: 'Lead', title: 'CEO' }
    });
    booking = await prisma.meetingBooking.create({
      data: {
        workspaceId: workspace.id,
        leadId: lead.id,
        twilioMessageSid: 'SM123456789',
        smsStatus: 'QUEUED'
      }
    });
  });

  afterEach(async () => {
    await prisma.activityLog.deleteMany();
    await prisma.meetingBooking.deleteMany();
    await prisma.lead.deleteMany();
    await prisma.company.deleteMany();
    await prisma.workspace.deleteMany();
    delete process.env.TWILIO_WEBHOOK_SIGNING_KEY;
  });

  it('live delivery updates smsStatus to DELIVERED and sets deliveredAt', async () => {
    delete process.env.TWILIO_WEBHOOK_SIGNING_KEY;

    const req = createRequest({
      MessageSid: 'SM123456789',
      MessageStatus: 'delivered'
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const b = await prisma.meetingBooking.findUnique({ where: { id: booking.id } });
    expect(b?.smsStatus).toBe('DELIVERED');
    expect(b?.smsDeliveredAt).not.toBeNull();
  });

  it('demo delivery is distinguished as DEMO', async () => {
    delete process.env.TWILIO_WEBHOOK_SIGNING_KEY;

    await prisma.meetingBooking.update({
      where: { id: booking.id },
      data: { twilioMessageSid: 'sms-demo-123' }
    });

    const req = createRequest({
      MessageSid: 'sms-demo-123',
      MessageStatus: 'sent'
    });
    await POST(req);

    const b = await prisma.meetingBooking.findUnique({ where: { id: booking.id } });
    expect(b?.smsStatus).toBe('SENT');
    expect(b?.smsSentAt).not.toBeNull();
    
    const logs = await prisma.activityLog.findFirst({ where: { leadId: lead.id } });
    expect(logs?.details).toContain('[DEMO]');
  });

  it('failed delivery updates status to FAILED', async () => {
    delete process.env.TWILIO_WEBHOOK_SIGNING_KEY;

    const req = createRequest({
      MessageSid: 'SM123456789',
      MessageStatus: 'undelivered',
      ErrorCode: '30005'
    });
    await POST(req);

    const b = await prisma.meetingBooking.findUnique({ where: { id: booking.id } });
    expect(b?.smsStatus).toBe('FAILED');
    expect(b?.failureReason).toContain('30005');
  });

  it('duplicate callback is idempotent', async () => {
    delete process.env.TWILIO_WEBHOOK_SIGNING_KEY;

    const req1 = createRequest({ MessageSid: 'SM123456789', MessageStatus: 'delivered' });
    const req2 = createRequest({ MessageSid: 'SM123456789', MessageStatus: 'delivered' });
    await POST(req1);
    await POST(req2);

    const logs = await prisma.activityLog.findMany({ where: { leadId: lead.id } });
    expect(logs.length).toBe(1);
  });

  it('invalid signature returns 403', async () => {
    const req = createRequest(
      { MessageSid: 'SM123456789', MessageStatus: 'delivered' }, 
      'invalid-sig'
    );
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('unknown SID is ignored gracefully', async () => {
    delete process.env.TWILIO_WEBHOOK_SIGNING_KEY;

    const req = createRequest({
      MessageSid: 'UnknownSID',
      MessageStatus: 'delivered'
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});
