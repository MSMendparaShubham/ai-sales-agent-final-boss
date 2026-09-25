import { prisma } from '@/lib/db/prisma';
import { MeetingBookingStatus } from './types';
import { canTransition } from './state-machine';

export class MeetingConciergeService {
  async createBookingRequest(params: {
    workspaceId: string;
    leadId: string;
    callId?: string;
    campaignId?: string;
    followUpPlanId?: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientName?: string;
    bookingUrl?: string;
  }) {
    // Check for existing active booking for this lead
    const existing = await prisma.meetingBooking.findFirst({
      where: {
        leadId: params.leadId,
        status: {
          notIn: ['BOOKED', 'CANCELED', 'STOPPED', 'EXPIRED', 'FAILED']
        }
      }
    });

    if (existing) {
      return existing; // Idempotent behavior
    }

    return await prisma.meetingBooking.create({
      data: {
        ...params,
        status: 'PENDING',
        nextCheckAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      }
    });
  }

  async transitionStatus(bookingId: string, newStatus: MeetingBookingStatus, updates: any = {}) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.meetingBooking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) throw new Error(`Booking ${bookingId} not found`);

      if (booking.status === newStatus) {
        // Already in this state, idempotent return
        return booking;
      }

      if (!canTransition(booking.status, newStatus)) {
        throw new Error(`Invalid state transition from ${booking.status} to ${newStatus}`);
      }

      return await tx.meetingBooking.update({
        where: { id: bookingId },
        data: {
          status: newStatus,
          ...updates
        }
      });
    });
  }

  async markSmsSent(bookingId: string, twilioMessageSid: string) {
    return await this.transitionStatus(bookingId, 'SMS_SENT', {
      twilioMessageSid,
      smsSentAt: new Date(),
    });
  }

  async markSmsDelivered(bookingId: string) {
    return await this.transitionStatus(bookingId, 'SMS_DELIVERED', {
      smsDeliveredAt: new Date(),
    });
  }

  async markBookingAwaiting(bookingId: string) {
    return await this.transitionStatus(bookingId, 'AWAITING_BOOKING');
  }

  async markBooked(bookingId: string, calendlyEventUri: string, calendlyScheduledAt: Date) {
    return await this.transitionStatus(bookingId, 'BOOKED', {
      calendlyEventUri,
      calendlyScheduledAt,
      bookedAt: new Date(),
      nextCheckAt: null,
      nextRetryAt: null
    });
  }

  async markCanceled(bookingId: string) {
    return await this.transitionStatus(bookingId, 'CANCELED', {
      canceledAt: new Date()
    });
  }

  async scheduleRetry(bookingId: string, nextRetryAt: Date) {
    return await this.transitionStatus(bookingId, 'RETRY_DUE', {
      nextRetryAt
    });
  }

  async startRetry(bookingId: string) {
    const booking = await prisma.meetingBooking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new Error(`Booking ${bookingId} not found`);

    if (booking.retryCount >= booking.maxRetries) {
      return await this.transitionStatus(bookingId, 'FAILED', {
        failureReason: 'Max retries exceeded'
      });
    }

    return await this.transitionStatus(bookingId, 'RETRYING', {
      retryCount: booking.retryCount + 1,
      lastRetryAt: new Date()
    });
  }

  async markRetryFailed(bookingId: string, reason: string) {
    return await this.transitionStatus(bookingId, 'FAILED', {
      failureReason: reason
    });
  }

  async stopOutreach(bookingId: string) {
    return await this.transitionStatus(bookingId, 'STOPPED', {
      nextCheckAt: null,
      nextRetryAt: null
    });
  }

  async escalateToHuman(bookingId: string) {
    return await this.transitionStatus(bookingId, 'ESCALATED', {
      nextCheckAt: null,
      nextRetryAt: null
    });
  }
}

export const meetingConciergeService = new MeetingConciergeService();
