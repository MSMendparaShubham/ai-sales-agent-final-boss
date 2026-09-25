import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { verifyCalendlySignature, processCalendlyWebhook } from '@/lib/meeting-concierge/calendly-webhook';
import crypto from 'crypto';

describe('Calendly Webhooks', () => {
  let workspace: any;
  let lead: any;
  let booking: any;

  beforeEach(async () => {
    workspace = await prisma.workspace.create({ data: { name: 'Test WS' } });
    const company = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: 'Test Company',
        domain: 'test.com',
        industry: 'Software',
        size: '1-10',
        location: 'Remote',
      }
    });

    lead = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        companyId: company.id,
        name: 'Webhook Tester',
        email: 'tester@webhook.com',
        title: 'Tester',
      }
    });
    booking = await prisma.meetingBooking.create({
      data: {
        workspaceId: workspace.id,
        leadId: lead.id,
        status: 'AWAITING_BOOKING',
        recipientEmail: 'tester@webhook.com'
      }
    });
  });

  afterEach(async () => {
    await prisma.activityLog.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.notification.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.meetingBooking.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.followUpPlan.deleteMany({ where: { leadId: lead.id } });
    await prisma.lead.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.company.deleteMany({ where: { workspaceId: workspace.id } });
    await prisma.workspace.deleteMany({ where: { id: workspace.id } });
  });

  it('valid signature is accepted', () => {
    const secret = 'my-secret';
    const payload = JSON.stringify({ event: 'test' });
    const t = Date.now().toString();
    const signature = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    const header = `t=${t},v1=${signature}`;
    
    expect(verifyCalendlySignature(payload, header, secret)).toBe(true);
  });

  it('invalid signature is rejected', () => {
    const secret = 'my-secret';
    const payload = JSON.stringify({ event: 'test' });
    const t = Date.now().toString();
    const header = `t=${t},v1=badsignature`;
    
    expect(verifyCalendlySignature(payload, header, secret)).toBe(false);
  });

  it('replay attack is rejected', () => {
    const secret = 'my-secret';
    const payload = JSON.stringify({ event: 'test' });
    const t = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes ago
    const signature = crypto.createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
    const header = `t=${t},v1=${signature}`;
    
    expect(verifyCalendlySignature(payload, header, secret)).toBe(false);
  });

  it('invitee.created updates booking and lead', async () => {
    const event = {
      event: 'invitee.created',
      payload: {
        email: 'tester@webhook.com',
        name: 'Webhook Tester',
        uri: 'uri-123',
        event: 'event-456',
        start_time: new Date().toISOString(),
        timezone: 'America/New_York'
      }
    };

    const res = await processCalendlyWebhook(event);
    expect(res.status).toBe('processed');
    expect(res.action).toBe('booked');

    const updatedBooking = await prisma.meetingBooking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking?.status).toBe('BOOKED');
    expect(updatedBooking?.calendlyInviteeUri).toBe('uri-123');

    const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
    expect(updatedLead?.status).toBe('MEETING');
  });

  it('invitee.canceled schedules follow-up plan', async () => {
    await prisma.meetingBooking.update({
      where: { id: booking.id },
      data: { status: 'BOOKED', calendlyInviteeUri: 'uri-cancel' }
    });

    const event = {
      event: 'invitee.canceled',
      payload: {
        email: 'tester@webhook.com',
        uri: 'uri-cancel',
      }
    };

    const res = await processCalendlyWebhook(event);
    expect(res.status).toBe('processed');
    expect(res.action).toBe('canceled');

    const updatedBooking = await prisma.meetingBooking.findUnique({ where: { id: booking.id } });
    expect(updatedBooking?.status).toBe('CANCELED');

    const followUp = await prisma.followUpPlan.findFirst({ where: { leadId: lead.id } });
    expect(followUp).not.toBeNull();
    expect(followUp?.action).toBe('SEND_SMS');
  });

  it('duplicate webhook is idempotent', async () => {
    await prisma.meetingBooking.update({
      where: { id: booking.id },
      data: { status: 'BOOKED', calendlyInviteeUri: 'uri-123' }
    });

    const event = {
      event: 'invitee.created',
      payload: {
        email: 'tester@webhook.com',
        uri: 'uri-123',
      }
    };

    const res = await processCalendlyWebhook(event);
    expect(res.status).toBe('idempotent');
  });

  it('wrong workspace or unknown email ignores', async () => {
    const event = {
      event: 'invitee.created',
      payload: {
        email: 'unknown@example.com',
      }
    };

    const res = await processCalendlyWebhook(event);
    expect(res.status).toBe('unmatched');
  });
});
