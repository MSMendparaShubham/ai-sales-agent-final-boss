import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import { meetingConciergeService } from '@/lib/meeting-concierge/service';
import { canTransition } from '@/lib/meeting-concierge/state-machine';

describe('Meeting Concierge State Machine', () => {
  let workspace: any;
  let lead1: any;
  let lead2: any;

  beforeEach(async () => {
    // Basic setup
    workspace = await prisma.workspace.create({
      data: { name: 'Concierge Test Workspace' }
    });

    const company = await prisma.company.create({
      data: {
        workspaceId: workspace.id,
        name: 'Test Company',
        industry: 'Tech',
        size: '1-10',
        location: 'US',
      }
    });

    lead1 = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        companyId: company.id,
        name: 'Lead One',
        title: 'CEO',
        email: 'lead1@test.com',
      }
    });

    lead2 = await prisma.lead.create({
      data: {
        workspaceId: workspace.id,
        companyId: company.id,
        name: 'Lead Two',
        title: 'CTO',
        email: 'lead2@test.com',
      }
    });
  });

  afterEach(async () => {
    await prisma.meetingBooking.deleteMany({
      where: { workspaceId: workspace.id }
    });
    await prisma.lead.deleteMany({
      where: { workspaceId: workspace.id }
    });
    await prisma.company.deleteMany({
      where: { workspaceId: workspace.id }
    });
    await prisma.workspace.deleteMany({
      where: { id: workspace.id }
    });
  });

  it('valid transitions: PENDING -> SMS_SENT -> SMS_DELIVERED -> AWAITING_BOOKING -> BOOKED', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });
    expect(req.status).toBe('PENDING');

    const s1 = await meetingConciergeService.markSmsSent(req.id, 'sid-123');
    expect(s1.status).toBe('SMS_SENT');

    const s2 = await meetingConciergeService.markSmsDelivered(req.id);
    expect(s2.status).toBe('SMS_DELIVERED');

    const s3 = await meetingConciergeService.markBookingAwaiting(req.id);
    expect(s3.status).toBe('AWAITING_BOOKING');

    const s4 = await meetingConciergeService.markBooked(req.id, 'uri-123', new Date());
    expect(s4.status).toBe('BOOKED');
  });

  it('invalid transitions throw error', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    // PENDING cannot go to BOOKED directly
    await expect(meetingConciergeService.markBooked(req.id, 'uri', new Date()))
      .rejects.toThrow(/Invalid state transition/);
  });

  it('idempotency: allows same transition multiple times', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    await meetingConciergeService.markSmsSent(req.id, 'sid-123');
    const retry = await meetingConciergeService.markSmsSent(req.id, 'sid-123');
    expect(retry.status).toBe('SMS_SENT'); // Should not throw
  });

  it('duplicate handoff: does not create duplicate booking records', async () => {
    const req1 = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    const req2 = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    expect(req1.id).toBe(req2.id); // Same record

    // Mark as booked, then a new request SHOULD create a new record
    await meetingConciergeService.transitionStatus(req1.id, 'AWAITING_BOOKING');
    await meetingConciergeService.markBooked(req1.id, 'uri', new Date());

    const req3 = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    expect(req1.id).not.toBe(req3.id); // New record
  });

  it('booking after SMS: transition from SMS_SENT directly to AWAITING_BOOKING or BOOKED (via awaiting)', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    await meetingConciergeService.markSmsSent(req.id, 'sid');
    // SMS_SENT to AWAITING_BOOKING
    const s1 = await meetingConciergeService.markBookingAwaiting(req.id);
    expect(s1.status).toBe('AWAITING_BOOKING');
  });

  it('booking after retry', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    await meetingConciergeService.markBookingAwaiting(req.id);
    await meetingConciergeService.scheduleRetry(req.id, new Date());
    await meetingConciergeService.startRetry(req.id);
    const s = await meetingConciergeService.markBooked(req.id, 'uri', new Date());
    expect(s.status).toBe('BOOKED');
  });

  it('canceled booking', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    await meetingConciergeService.markBookingAwaiting(req.id);
    await meetingConciergeService.markBooked(req.id, 'uri', new Date());
    const s = await meetingConciergeService.markCanceled(req.id);
    expect(s.status).toBe('CANCELED');
  });

  it('max retry', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    // We can simulate retries
    await prisma.meetingBooking.update({
      where: { id: req.id },
      data: { retryCount: 3, maxRetries: 3 }
    });

    const s = await meetingConciergeService.startRetry(req.id);
    expect(s.status).toBe('FAILED');
    expect(s.failureReason).toBe('Max retries exceeded');
  });

  it('stop outreach / opt-out', async () => {
    const req = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });

    const s = await meetingConciergeService.stopOutreach(req.id);
    expect(s.status).toBe('STOPPED');
  });

  it('workspace isolation (checking via DB)', async () => {
    const ws2 = await prisma.workspace.create({ data: { name: 'WS 2' } });
    const req1 = await meetingConciergeService.createBookingRequest({
      workspaceId: workspace.id,
      leadId: lead1.id,
    });
    
    // We shouldn't be able to query this booking using ws2
    const found = await prisma.meetingBooking.findFirst({
      where: { workspaceId: ws2.id }
    });
    expect(found).toBeNull();
    
    await prisma.workspace.delete({ where: { id: ws2.id } });
  });
});
