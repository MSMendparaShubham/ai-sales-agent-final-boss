export type MeetingBookingStatus =
  | 'PENDING'
  | 'SMS_PENDING'
  | 'SMS_SENT'
  | 'SMS_DELIVERED'
  | 'AWAITING_BOOKING'
  | 'BOOKED'
  | 'CANCELED'
  | 'RETRY_DUE'
  | 'RETRYING'
  | 'ESCALATED'
  | 'STOPPED'
  | 'EXPIRED'
  | 'FAILED';

export interface MeetingBookingState {
  id: string;
  status: MeetingBookingStatus;
  leadId: string;
}
