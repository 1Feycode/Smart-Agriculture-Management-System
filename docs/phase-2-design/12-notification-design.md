# 12. Notification Design

## Notification types and event triggers

| Type | Trigger | Recipient | Related FR IDs |
|---|---|---|---|
| `question_answered` | Authorized expert creates a final answer | Question owner farmer | FR-103 |
| `recommendation_reviewed` | Recommendation enters approved/rejected/expert-reviewed state | Recommendation owner farmer | FR-061, FR-104 |
| `recommendation_needs_information` | Expert requests a missing field/test | Recommendation owner farmer | FR-062 |
| `weather_alert` | Provider supplies an explicitly supported alert matching a user-selected location | Users subscribed/authorized for that location; subscription policy TBD | FR-073, FR-105 |
| `market_price_update` | Approved market update matches an explicit subscription or operational policy | Authorized users only; audience/opt-in TBD | FR-106 |
| `account_status_changed` | Trusted admin workflow changes account active state | Affected account; administrator audit copy if approved | FR-012 |
| `administrative_action` | High-impact administrative action that requires user notice | Target user or designated admins | FR-121, FR-123 |

Weather and market notifications are conditional on supported providers and stakeholder-approved subscriptions. Do not notify every user by default.

## Firestore structure

Use top-level `notifications/{notificationId}` for recipient-filtered queries:

```json
{
  "recipientUid": "uid-farmer-001",
  "type": "question_answered",
  "title": "An expert replied",
  "body": "Your agricultural question has an update.",
  "entityPath": "questions/question-001",
  "createdAt": "<server timestamp>",
  "readAt": null,
  "dedupeKey": "question-001-answer-001"
}
```

Keep text short and avoid embedding sensitive farm/health details. `entityPath` is a navigation hint, never an authorization grant. The referenced document has its own Rules. Use a deterministic dedupe key or transaction to avoid duplicate notifications on function retries.

## Creation, read state and access rules

- Trusted function/Admin SDK creates notifications after validating event and recipient. Direct client create/delete is denied.
- Recipient and admin (for audited support, if policy permits) can read; recipient update is limited to `readAt`. User cannot alter title/body/type/recipient/entity.
- Mark-as-read sets `readAt` using a server timestamp. For unread, either use a dedicated explicit reset operation under an agreed policy or do not allow marking read-to-unread.
- Keep notification history; retention/deletion period is **To be confirmed with stakeholders**.
- Roles and privacy are enforced in Firestore Rules, not in the notification UI.

## UI placement and badge count

Place an inbox link and accessible notification indicator in the signed-in header; show newest first with type/date/read state and a link to the source record. Color is not the only status cue. Support unread/all filters and cursor pagination.

Exact unread count has a read cost. Prefer loading the newest bounded inbox page and showing unread state on those records; if an accurate global count is required, use a Firestore aggregation query on `recipientUid` and `readAt` only on sign-in/inbox open, not a real-time listener. A denormalized counter requires trusted increment/decrement logic and reconciliation; choose only after expected usage is known. Display “new” or “9+” only if that value is genuinely supported by the query.

## Free-tier strategy

Generate notifications only for events users need, batch only when transaction semantics permit, deduplicate retries, avoid per-user fan-out for global events unless the audience opted in, paginate reads, and do not keep a listener open across every page. Functions are optional only if the free-tier deployment constraint allows them; otherwise the event-driven notification requirement needs an approved trusted backend or must be downgraded to status visibility.
