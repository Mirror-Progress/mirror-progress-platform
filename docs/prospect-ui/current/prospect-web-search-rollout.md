# Prospect public search and usage rollout

This change keeps MP in the existing Prospect chat. The web-search tool is absent until both `PROSPECT_WEB_SEARCH_GATEWAY_URL` and `PROSPECT_WEB_SEARCH_TOOL_NAME` are set. Existing project search stays available. The dedicated Gateway now exists in account `380314682150` in `us-east-1`: ID `prospect-web-search-wo28nhgxid`, target `PLE3MP9WOD`, both READY. A signed `tools/list` call returned `web-search-tool___WebSearch`; one bounded call through the adapter returned two cited HTTPS results. The production task role and environment still need a separate rollout.

## Gateway setup (steps 1–4 completed; review before production rollout)

1. In `us-east-1`, create a dedicated `ProspectWebSearchGatewayRole` with `bedrock-agentcore.amazonaws.com` trust. Constrain trust with `aws:SourceAccount=380314682150` and `aws:SourceArn=arn:aws:bedrock-agentcore:us-east-1:380314682150:gateway/*`.
2. Give that role `bedrock-agentcore:InvokeGateway` on `arn:aws:bedrock-agentcore:us-east-1:380314682150:gateway/*` and `bedrock-agentcore:InvokeWebSearch` on `arn:aws:bedrock-agentcore:us-east-1:aws:tool/web-search.v1`. [AWS connector setup](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-add-target-api-target-config.html#gateway-target-connector-web-search-tool).
3. Create the Gateway with MCP and IAM inbound authorization:

   ```sh
   aws bedrock-agentcore-control create-gateway --region us-east-1 --name prospect-web-search --role-arn arn:aws:iam::380314682150:role/ProspectWebSearchGatewayRole --protocol-type MCP --protocol-configuration '{"mcp":{"supportedVersions":["2025-11-25"]}}' --authorizer-type AWS_IAM
   ```

4. Once it is ready, use the returned Gateway ID to create the native search target:

   ```sh
   aws bedrock-agentcore-control create-gateway-target --region us-east-1 --gateway-identifier "$GATEWAY_ID" --name web-search-tool --target-configuration '{"mcp":{"connector":{"source":{"connectorId":"web-search","version":"1.2.0"},"configurations":[{"name":"WebSearch","parameterValues":{}}]}}}' --credential-provider-configurations '[{"credentialProviderType":"GATEWAY_IAM_ROLE"}]'
   ```

5. Attach only `bedrock-agentcore:InvokeGateway` on `arn:aws:bedrock-agentcore:us-east-1:380314682150:gateway/prospect-web-search-wo28nhgxid` to the Prospect application task role `arn:aws:iam::380314682150:role/MirrorProgressPlatform-ApplicationTaskRole69491568-J1wMgFpM4EjD`. Set `PROSPECT_WEB_SEARCH_GATEWAY_URL=https://prospect-web-search-wo28nhgxid.gateway.bedrock-agentcore.us-east-1.amazonaws.com/mcp`, `PROSPECT_WEB_SEARCH_TOOL_NAME=web-search-tool___WebSearch`, and `PROSPECT_WEB_SEARCH_REGION=us-east-1` on the platform server task. Do not expose these variables to browser JavaScript. Use the existing AWS role credentials, with no API key.
6. Deploy the reviewed private release client image to ECS cluster `mirror-progress-production`, service `MirrorProgressPlatform-PlatformServiceFC40B7AF-nK4RbK3d0Gmi` (currently task `MirrorProgressPlatformPlatformTask7EF10EC3:63`, `PlatformContainer`, 2/2 running). The current image comes from ECR repository `mirror-identity-production`, tag `prospect-market-detail-20260926`. Verify an authenticated Prospect chat can search for an external project and responds with clickable citations; verify a question about an existing project stays in the internal catalog. Confirm a signed-out request to `/api/products/studioiq/agent` is denied. Roll back by removing either search environment variable.

The app caps results at five per search, allows four web searches per question, and limits each account to fifty searches per UTC day using a two-day operational quota counter. Do Not Track suppresses behavioral event storage even for server-side web searches; the short-lived counter still enforces cost limits. This is an application cost guard, not an AWS account-level budget. Set an AWS Budget alert for AgentCore Gateway and Web Search charges before production rollout. [AWS pricing](https://aws.amazon.com/bedrock/agentcore/pricing/) currently lists Web Search at $7 per 1,000 queries, plus Gateway usage.

## Usage data

Prospect records attention time for Discovery's globe/list, project dossier tabs, and Source workspace; Discovery search terms submitted by Enter or focus change (not keystrokes); project opens and favorite changes; agent question counts; and public search terms. Existing chat sessions retain the full conversation; this event stream does not duplicate prompts or answers. Events are linked to the authenticated account and organization, omit IP/device identifiers, redact email addresses and phone numbers from stored searches, and expire after 90 days. Source snippets and result pages are not stored in analytics. The browser honors Do Not Track; both usage endpoints honor the DNT request header. The write endpoint enforces same-origin JSON requests and caps each account at 250 usage events per UTC day. Authorized administrators can read aggregate organization/time-window screen attention, submitted search terms, and project interest at `/api/admin/products/studioiq/usage-summary?days=30`; it returns no chat prompts or answer text. The usage stream is for product analysis and sourcing prioritization; it is not a reinforcement-learning training pipeline. A later training pipeline would need explicit data selection, evaluation, and user controls.

AWS requires keeping citations with outputs that use its Web Search results and prohibits bulk storage of search content. The MP prompt enforces cited answers; review this in the live search acceptance test. [AWS Web Search acceptable use](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-web-search-tool.html#gateway-target-connector-web-search-tool-acceptable-use).
