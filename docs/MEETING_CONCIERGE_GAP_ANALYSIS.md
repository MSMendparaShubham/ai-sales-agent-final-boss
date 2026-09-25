# Meeting Concierge Gap Analysis

## 1. Current Architecture
- **Human Handoff**: When a lead requests a human during an AI call, the AI invokes `performHumanHandoff()` (`src/lib/voice/intelligence.ts`). This function terminates the call and optionally dispatches an SMS containing a Calendly booking link using `dispatchCalendlySms()` (`src/lib/voice/calendly.ts`) via the Twilio API.
- **Calendly Implementation**: Calendly links are dynamically built with pre-filled lead data. However, the system relies on a mock function (`confirmCalendlyBooking`) triggered via a UI modal (`CalendlyBookingModal`) to confirm bookings. There is **no automated webhook** to verify if a prospect actually books a meeting.
- **Retry/Follow-Up Plan**: The `FollowUpPlan` model and planner (`src/lib/scoring/planner.ts`) handles scheduling next actions (e.g., `RETRY_CALL`, `SEND_CONTENT`), but there is no mechanism linking the sent Calendly SMS to a verification timeout or an intelligent retry loop if unbooked.
- **Twilio Implementation**: Inbound SMS replies (e.g., "YES") are parsed via a webhook (`/api/webhooks/twilio`) to send conversational replies, but do not integrate tightly with the FollowUpPlan retry cycle.

## 2. Exact Gaps
1. **Missing Calendly Webhook Integration**: No endpoint exists (e.g., `/api/webhooks/calendly/route.ts`) to receive Calendly's `invitee.created` events and automatically transition the lead state.
2. **Missing State Management**: The `Lead` status does not distinguish between a regular contact and a prospect pending a Calendly booking.
3. **Missing Automated Retry Loop**: No background job or `FollowUpPlan` action is configured to wait for a booking and intelligently call the prospect again if they fail to book within a designated timeframe (e.g., 24 hours).
4. **Handoff Disconnect**: `performHumanHandoff` dispatches the SMS but does not register a pending state or schedule a FollowUpPlan to track completion.

## 3. Proposed State Machine
- **State 1 (Call Active)**: Lead requests to speak with a human.
- **State 2 (Handoff Requested)**: AI ends the call and invokes `performHumanHandoff()`.
  - System sends an SMS with the Calendly link.
  - Lead `status` is updated to `CONTACTED_PENDING_BOOKING`.
  - System schedules a `FollowUpPlan` with action `VERIFY_BOOKING` (or a `RETRY_CALL` deferred by 24h).
- **State 3a (Lead Books Meeting)**:
  - Calendly webhook receives `invitee.created`.
  - Lead `status` is updated to `MEETING`.
  - Pending `FollowUpPlan` is marked `COMPLETED` or cancelled.
  - Opportunity is moved into the meeting-confirmed workflow.
- **State 3b (Lead Does Not Book)**:
  - 24-hour timeout elapses.
  - Background worker picks up the `FollowUpPlan`.
  - System verifies no booking exists.
  - System executes the intelligent retry policy (e.g., transitions FollowUpPlan to `RETRY_CALL` and queues a new outbound AI call).

## 4. Proposed Database Changes
- **Lead Schema (`prisma/schema.prisma`)**:
  - Add `CONTACTED_PENDING_BOOKING` to the `status` enum comments and logic.
- **FollowUpPlan Schema (`prisma/schema.prisma`)**:
  - Add `VERIFY_BOOKING` to the `action` enum comments.
- **Callback/Call Schema**:
  - Optional: Add `calendlyEventUri` to track the external Calendly ID to prevent duplicates.

## 5. API Changes
- **Create New Endpoint**: `src/app/api/webhooks/calendly/route.ts` to listen for Calendly webhooks, validate signatures, and update Lead/FollowUpPlan states.
- **Modify Handoff Logic**: Update `performHumanHandoff` in `src/lib/voice/intelligence.ts` to automatically generate a `VERIFY_BOOKING` FollowUpPlan.
- **Modify FollowUp Planner**: Update `generateFollowUpPlan` in `src/lib/scoring/planner.ts` to process the new `VERIFY_BOOKING` action.

## 6. UI Changes
- **Pipeline/Lead Views**: Render the new `PENDING_BOOKING` state with a specific badge or column in the CRM opportunity graph.
- **CalendlyBookingModal**: Fetch live status from the database instead of relying purely on simulated state. Update the UI to reflect a "waiting for webhook" or "confirmed via webhook" badge.

## 7. Test Plan
- **Unit Tests**: Test the new Calendly webhook handler for valid and invalid signatures.
- **Integration Tests**: Verify that `performHumanHandoff` correctly creates the deferred FollowUpPlan and sets the correct Lead status.
- **E2E Tests**: Simulate an AI call requesting a human, verify the SMS is "sent", simulate the Calendly webhook firing, and assert that the FollowUpPlan is cancelled and Lead status is `MEETING`. Also test the negative path (timeout triggers a retry call).

## 8. Environment Variables
- `CALENDLY_WEBHOOK_SIGNING_KEY` (Required for webhook validation)
- `CALENDLY_PERSONAL_TOKEN` (Optional, if polling is implemented as a fallback)

## 9. Production vs Demo Behavior
- **Demo Mode**: If Twilio/Calendly credentials are not set, `dispatchCalendlySms` continues to simulate delivery. The webhook endpoint can accept mock payloads to simulate booking completion.
- **Production Mode**: Strictly enforces Twilio signature validation and Calendly webhook signature validation. Actual SMS delivery status is tracked.

## 10. Rollback Considerations
- If the automated verification fails, users should be able to manually confirm the booking via the `CalendlyBookingModal` (preserving the current manual fallback).
- Ensure existing FollowUpPlan actions (`RETRY_CALL`, `SCHEDULE_MEETING`) are unaffected for flows that do not use Calendly.
