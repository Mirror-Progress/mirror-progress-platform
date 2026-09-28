# Prospect product goals and business context

## Who it serves

Prospect serves architecture, design, and related project-led practices that need a clearer view of upcoming work. A firm may already have a normalized portfolio in Mirror Progress, may bring its own projects later, or may have no portfolio at all. Discovery remains useful in each case. The product should not manufacture a relevance score just because a portfolio is absent.

The immediate users include firm leaders and project teams evaluating opportunities, plus Mirror Progress administrators who manage access and trials. Firm portfolio projects and private saved projects are scoped to the right organization or account; neither is an automatic contribution to the shared opportunity catalog.

## The job Prospect should do

Prospect shortens the distance between **finding a project** and **deciding whether to investigate it**:

- Surface opportunities from multiple geographies and project types in a browsable globe and list.
- Preserve the source trail so a user can verify timing, requirements, and claims before acting.
- Relate opportunities to a firm's approved past work when defensible evidence exists.
- Let a user ask natural-language questions and move directly from an answer to a focused project, source, or guided screen.
- Let a user privately save a promising project found through web research without waiting for Mirror Progress to publish it globally.
- Use aggregated demand signals and private saves to guide future sourcing decisions, while keeping private records private unless an explicit editorial process promotes them.

The value is **actionable context**, not a large vanity ticker or an opaque numerical score. Market Pulse provides fixed, source-linked macro indicators with observation periods. Those figures help orient a user but should never be presented as a current project statistic or a guarantee about a bid.

## Main workflows

**Explore and verify.** A user filters Discovery, focuses a project, reads the overview and practice context, then opens Evidence to examine original source material. The Source workspace carries the same assistant conversation and appearance theme. Approximate map coordinates are labeled as such; the map must not imply street-level precision when only a city or country is known.

**Bring in firm work.** An authorized firm admin uploads project material. Bedrock extracts a draft, but a human reviews and approves it before it becomes a practice precedent. Approved precedents can support fit explanations. Firms without precedents still see opportunities, with fit context omitted rather than fabricated.

**Ask and save.** Ask MP can answer from the account-visible project catalog and evidence, search the public web when that tool is available, and focus a project in the UI. A web hit saved to My Globe stays private to the account. Its title, location, buyer, stage, and dates go through a separate Bedrock extraction and evidence check before storage. Unsupported fields remain empty. A saved web hit is marked unverified; it does not inherit the authority of Mirror Progress's published catalog.

**Learn the product.** The first-entry walkthrough points to active capabilities, with motion between screens. It can be replayed from settings or the menu, and the assistant can call approved guide scenes. Scene IDs come from an active workflow registry, so a removed feature cannot be invoked by an arbitrary model-generated selector. The guide covers Discovery, Evidence, the firm portfolio when available, and the assistant.

## Trust and business boundaries

| Record | Meaning | Boundary |
| --- | --- | --- |
| Published opportunity | Mirror Progress research result with provenance and freshness rules | Visible only to entitled customers; still requires source review |
| Private saved web project | An account-owned research lead | Normalized but unverified; not automatically published to everyone |
| Firm portfolio precedent | The customer's own work | Approved state controls use in practice-fit context; it is not a bid opportunity |

Agent output assists investigation. It should link to records and quote evidence rather than replace the original source. Trials and billing control workspace use, not ownership of the account: a trial begins after successful first sign-in, not when the invitation email is sent.

Search and usage events can inform sourcing and product improvement. The implementation scopes them to accounts, honors the current Do Not Track behavior for web-search usage logging, and has retention limits. Expansion of analytics or training use is a product and privacy decision, not an implied license to reuse customer files.

## Current limits

The web search tool depends on its configured service and quota. Search snippets can be incomplete; normalization rejects a project when it cannot support a clean title rather than inventing one. Private saves are not automatically promoted to the shared globe. Portfolio import requires human review. The portfolio tour step received a contrast and alignment fix, but exact visual QA is still needed on a real account and mobile viewport. These are current limits, not promised future capabilities.
