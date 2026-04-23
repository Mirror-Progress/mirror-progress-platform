## Current Homepage Notes

The active homepage remains a single-page experience built in the Next.js app.

### Active sections

- Header
- Hero
- Capabilities
- Form
- Footer

### Capability content source

- `client/constants/index.ts`
  - `capabilityBuckets`

### Account flow touchpoints

- Header avatar menu
- Footer avatar menu
- Auth dialog for login/signup
- Welcome page at `/account/welcome`

### Current implementation direction

- Keep homepage-facing features in the Next.js app
- Avoid deepening the split with the unused FastAPI backend unless product scope changes
