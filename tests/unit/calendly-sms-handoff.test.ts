import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CALENDLY_BASE_URL,
  PRESET_CALENDLY_TIMESLOTS,
  buildCalendlyUrl,
  generateCalendlySmsText,
  dispatchCalendlySms,
  confirmCalendlyBooking,
  getUpcomingBusinessDates,
} from '@/lib/voice/calendly';
import { performHumanHandoff } from '@/lib/voice/intelligence';
import { CALENDLY_HANDOFF_SCENARIO_EN, getCalendlyHandoffTurn } from '@/lib/voice/scenarios';
import { getDemoCallbacks } from '@/lib/voice/callbacks-store';

describe('Calendly SMS Handoff & Booking Subsystem', () => {
  describe('URL & SMS Text Generation', () => {
    it('constructs a pre-filled Calendly booking URL with lead parameters', () => {
      const url = buildCalendlyUrl({
        leadName: 'John Smith',
        leadEmail: 'john.smith@technova.com',
        companyName: 'TechNova Solutions',
        topic: 'SharePoint Modernization Architecture',
      });

      expect(url).toContain(DEFAULT_CALENDLY_BASE_URL);
      expect(url).toContain('name=John+Smith');
      expect(url).toContain('email=john.smith%40technova.com');
      expect(url).toContain('a1=TechNova+Solutions');
    });

    it('generates personalized SMS message copy with Calendly link', () => {
      const calendlyUrl = 'https://calendly.com/intentos-solutions/discovery?name=John';
      const smsText = generateCalendlySmsText({
        leadName: 'John Smith',
        calendlyUrl,
        companyName: 'TechNova Solutions',
      });

      expect(smsText).toContain('Hi John');
      expect(smsText).toContain('solutions engineering team');
      expect(smsText).toContain(calendlyUrl);
      expect(smsText).toContain('preferred timeslot');
    });
  });

  describe('Preset Preferred Timeslots Configuration', () => {
    it('provides preset preferred timeslots configured for the engineering team', () => {
      expect(PRESET_CALENDLY_TIMESLOTS.length).toBeGreaterThanOrEqual(4);

      // Verify slot structures
      const morningSlot = PRESET_CALENDLY_TIMESLOTS.find((s) => s.period === 'Morning');
      expect(morningSlot).toBeDefined();
      expect(morningSlot?.time).toContain('AM');

      const recommendedSlot = PRESET_CALENDLY_TIMESLOTS.find((s) => s.recommended === true);
      expect(recommendedSlot).toBeDefined();
      expect(recommendedSlot?.time).toContain('02:00 PM');

      const fastestSlot = PRESET_CALENDLY_TIMESLOTS.find((s) => s.availability === 'Fastest Response');
      expect(fastestSlot).toBeDefined();
    });

    it('generates upcoming business days excluding weekends', () => {
      const dates = getUpcomingBusinessDates();
      expect(dates.length).toBe(5);
      dates.forEach((d) => {
        expect(d.dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(d.label).toBeDefined();
        // Day of week check
        const day = new Date(d.dateStr).getDay();
        expect(day).not.toBe(0); // Not Sunday
        expect(day).not.toBe(6); // Not Saturday
      });
    });
  });

  describe('SMS Dispatching During AI Call', () => {
    it('dispatches an SMS containing Calendly link with delivery tracking', async () => {
      const dispatch = await dispatchCalendlySms({
        leadId: 'hero-lead',
        phoneNumber: '+1 (555) 123-4567',
        leadName: 'John Smith',
        companyName: 'TechNova Solutions',
        reason: 'Prospect requested to speak with human specialist',
      });

      expect(dispatch.messageId).toBeDefined();
      expect(dispatch.recipientPhone).toBe('+1 (555) 123-4567');
      expect(dispatch.recipientName).toBe('John Smith');
      expect(dispatch.delivered).toBe(true);
      expect(dispatch.sentAt).toBeDefined();
      expect(dispatch.calendlyUrl).toContain('calendly.com');
      expect(dispatch.messageBody).toContain(dispatch.calendlyUrl);
      expect(dispatch.preferredSlots.length).toBeGreaterThan(0);
    });
  });

  describe('Direct Timeslot Booking Confirmation', () => {
    it('confirms booking for preferred timeslot and updates callback queue', async () => {
      const dates = getUpcomingBusinessDates();
      const testDate = dates[0].dateStr;
      const testSlot = PRESET_CALENDLY_TIMESLOTS[2].time; // 2:00 PM

      const booking = await confirmCalendlyBooking({
        leadId: 'hero-lead',
        date: testDate,
        timeSlot: testSlot,
        timezone: 'EST',
        leadName: 'John Smith',
        companyName: 'TechNova Solutions',
        notes: '30-minute SharePoint architecture scoping',
      });

      expect(booking.bookingId).toContain('CAL-BOOK-');
      expect(booking.date).toBe(testDate);
      expect(booking.timeSlot).toBe(testSlot);
      expect(booking.timezone).toBe('EST');
      expect(booking.status).toBe('CONFIRMED');
      expect(booking.teamMember).toContain('Solutions');
      expect(booking.meetingLink).toBeDefined();

      // Verify callback queue updated
      const callbacks = getDemoCallbacks();
      const bookedInQueue = callbacks.find((c) => c.id === booking.bookingId);
      expect(bookedInQueue).toBeDefined();
      expect(bookedInQueue?.scheduledDate).toBe(testDate);
      expect(bookedInQueue?.scheduledTime).toContain(testSlot);
    });
  });

  describe('Integration with Human Handoff Workflow', () => {
    it('performHumanHandoff automatically dispatches Calendly SMS', async () => {
      const result = await performHumanHandoff({
        leadId: 'hero-lead',
        reason: 'Prospect requested to talk to solutions engineer',
        sendCalendlySms: true,
        phoneNumber: '+1 (555) 123-4567',
      });

      expect(result.success).toBe(true);
      expect(result.sms).toBeDefined();
      expect(result.sms.recipientPhone).toBe('+1 (555) 123-4567');
      expect(result.sms.calendlyUrl).toContain('calendly.com');
      expect(result.message).toContain('Text message with Calendly booking link sent');
    });
  });

  describe('Conversational Scenario & Turn Definitions', () => {
    it('verifies human handoff scenario dialogue and Calendly SMS statement', () => {
      const scenario = CALENDLY_HANDOFF_SCENARIO_EN;
      expect(scenario.id).toBe('HUMAN_HANDOFF_CALENDLY_EN');
      expect(scenario.turns.length).toBe(2);

      // Turn 1: Lead asks to speak with human specialist
      expect(scenario.turns[0].leadResponse).toContain('speak directly with a human specialist');
      expect(scenario.turns[0].signals.objection).toContain('Prefers speaking with human');

      // Turn 2: AI announces SMS with Calendly link sent
      expect(scenario.turns[1].aiStatement).toContain('sent a text message to your phone with our team\'s Calendly booking link');
      expect(scenario.turns[1].leadResponse).toContain('received the text message');
      expect(scenario.turns[1].signals.buyingStage).toBe('Meeting Scheduled');
    });

    it('generates dynamic handoff turn personalized with lead name', () => {
      const turn = getCalendlyHandoffTurn('Sarah Connor');
      expect(turn.aiStatement).toContain('Certainly, Sarah!');
      expect(turn.aiStatement).toContain('Calendly booking link');
      expect(turn.leadResponse).toContain('received the text message');
      expect(turn.signals.buyingStage).toBe('Meeting Scheduled');
    });
  });
});
