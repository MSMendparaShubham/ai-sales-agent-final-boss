import { MeetingBookingStatus } from './types';

export const VALID_TRANSITIONS: Record<MeetingBookingStatus, MeetingBookingStatus[]> = {
  PENDING: ['SMS_PENDING', 'SMS_SENT', 'SMS_DELIVERED', 'AWAITING_BOOKING', 'FAILED', 'STOPPED'],
  SMS_PENDING: ['SMS_SENT', 'SMS_DELIVERED', 'FAILED', 'STOPPED', 'AWAITING_BOOKING'],
  SMS_SENT: ['SMS_DELIVERED', 'FAILED', 'STOPPED', 'AWAITING_BOOKING'],
  SMS_DELIVERED: ['AWAITING_BOOKING', 'FAILED', 'STOPPED'],
  AWAITING_BOOKING: ['BOOKED', 'RETRY_DUE', 'EXPIRED', 'STOPPED'],
  BOOKED: ['CANCELED'],
  CANCELED: ['RETRY_DUE', 'STOPPED'],
  RETRY_DUE: ['RETRYING', 'STOPPED'],
  RETRYING: ['BOOKED', 'RETRY_DUE', 'ESCALATED', 'FAILED', 'STOPPED', 'AWAITING_BOOKING'],
  ESCALATED: ['STOPPED'],
  STOPPED: [],
  EXPIRED: [],
  FAILED: ['RETRY_DUE', 'STOPPED'],
};

export function canTransition(from: string, to: string): boolean {
  if (from === to) return true; // Idempotent
  const allowed = VALID_TRANSITIONS[from as MeetingBookingStatus];
  if (!allowed) return false;
  return allowed.includes(to as MeetingBookingStatus);
}
