# Calendly Webhook Integration

## Overview
IntentOS uses Calendly webhooks to deterministically track when a lead schedules or cancels a meeting after human handoff.

## Environment Variables
- `CALENDLY_API_TOKEN`: Your Calendly API token.
- `CALENDLY_ORGANIZATION_URI`: The organization URI.
- `CALENDLY_USER_URI`: The user URI.
- `CALENDLY_EVENT_TYPE_URL`: The default booking event URL.
- `CALENDLY_WEBHOOK_SIGNING_KEY`: A randomly generated secure key to verify incoming webhooks.
- `CALENDLY_WEBHOOK_URL`: The public URL of the IntentOS webhook endpoint.

## Webhook Setup
1. Expose `https://<your-domain>/api/webhooks/calendly` as the webhook URL.
2. In Calendly, subscribe to `invitee.created` and `invitee.canceled` events.
3. Configure your `CALENDLY_WEBHOOK_SIGNING_KEY` on both Calendly and IntentOS.

## Security
- **Signatures**: IntentOS verifies `Calendly-Webhook-Signature` using `CALENDLY_WEBHOOK_SIGNING_KEY`.
- **Replay Protection**: Built-in 5-minute tolerance.
- **Idempotency**: Duplicate webhook payloads are gracefully skipped.

## Local Demo Procedure
For local hackathons and testing without exposing a public tunnel:
1. Ensure `DEMO_MODE=true` in `.env`.
2. Post JSON payloads to `/api/webhooks/calendly/test`.

```json
{
  "event": "invitee.created",
  "payload": {
    "email": "lead@example.com",
    "uri": "fake-uri-123"
  }
}
```

## Production Procedure
1. Set `DEMO_MODE=false`.
2. Register the real webhook with Calendly API.
3. Monitor `ActivityLog` and `Notification` to observe successful transitions.

## Failure Handling
- **Missing Signature**: Webhook returns 401.
- **Unmatched Email**: Webhook ignores and logs unhandled request.
- **Canceled Bookings**: The state machine creates a `FollowUpPlan` to schedule an automated retry via SMS based on policy.
