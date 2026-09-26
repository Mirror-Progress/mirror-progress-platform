# Prospect header and assistant UI

These `.txt` files are source snapshots from the current private Prospect release, saved here because the public repository's root `client` is an obsolete baseline. Remove the `.txt` suffix when copying them into the matching paths of `identity-release/client`; do not apply them to the root `client`.

The update gives the Ask logo a mineral-green light-mode color, refines the menu/account/theme controls, and adds layered glass and depth to the assistant card and composer. On phones, it condenses the summary and view switch, collapses search and filters, opens with the globe unobstructed, and keeps a single Ask control in the header. It was checked at 320px and 390px, including chat close and reopen. TypeScript and the Next.js production build pass locally.

No GitHub Actions deployment is required for this source record.

The Market Pulse source snapshots add a keyless, sourced economic ticker to Prospect. The data service refreshes World Bank development indicators and commodity indices plus IRENA renewable capacity, caches the last good result, and exposes only the latest available country figures. The ticker includes a searchable market picker with a mobile-friendly menu. The source snapshots include the matching product and local-preview API routes, agent market context, and the exact package manifest and lockfile from the release client. Copy these files into `identity-release/client` without the `.txt` suffix; the root `client` remains obsolete. The release client passed TypeScript and focused lint checks, and the picker was exercised at desktop and 390px mobile widths.

The city-anchor snapshot adds approximate California city and regional reference points for 32 projects that appeared at one U.S. country marker in the production globe. The coordinates come from the [2025 U.S. Census California places](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_gaz_place_06.txt) and [counties](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_gaz_counties_06.txt) gazetteers, with NASA's published Moffett Field reference for that project. The matching test snapshot checks that the 32 projects remain selectable and disperse across the map.

The light-mode mobile market control now uses legible light text and borders on its dark ticker surface, including its search menu. It was visually checked at 390px with the chat open.

The Prospect assistant now streams answer text in bounded chunks and continues automatically when Bedrock reports `max_tokens`, preserving one continuous chat answer until `end_turn`. Recent conversation text can retain up to 12,000 characters per turn. A local long-answer test produced roughly 68,000 characters across five continuations and ended with a completion event.
