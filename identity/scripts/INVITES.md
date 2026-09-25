# Prospect invitations

The owner can send an individual invitation at [accounts.mirrorprogress.com/?manage=1](https://accounts.mirrorprogress.com/?manage=1): enter the person's name, email, account type, company, and role, then select **Send invitation**. The list below the form shows delivery and acceptance.

For an operator sending several invitations, create a local JSON file with 1–10 entries:

```json
[
  {"name":"Example Person","email":"person@mirrorprogress.com","company":"Mirror Progress","accountType":"admin","role":"project_lead"}
]
```

Run `node identity/scripts/invite-people.mjs invitees.json --check` to validate the list and the AWS account without sending. Then run `node identity/scripts/invite-people.mjs invitees.json` to issue and deliver the invitations. The command reports each recipient's outcome and the final mail-service status. It reuses an unexpired invitation instead of sending duplicates. The owner must have signed in with a passkey within five minutes; the database validates that session for each issue or resend. Neither the command nor its logs expose invitation links.

External addresses need a configured delivery provider. The command reports `delivery_unavailable` and does not create an invitation when SES cannot send to that address. Prospect mail uses `hello@mirrorprogress.com` as its sender. A mail provider accepting the message is not proof of inbox delivery or account acceptance.
