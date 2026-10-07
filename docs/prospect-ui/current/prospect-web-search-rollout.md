# Prospect public search and usage rollout

This change keeps MP in the existing Prospect chat. The web-search tool is absent until both `PROSPECT_WEB_SEARCH_GATEWAY_URL` and `PROSPECT_WEB_SEARCH_TOOL_NAME` are set. Existing project search stays available. The dedicated Gateway exists in account `<aws-account-id>` in `us-east-1`: ID `<gateway-id>`, target `<gateway-target-id>`, both READY. A signed `tools/list` call returned `web-search-tool___WebSearch`; one bounded call through the adapter returned two cited HTTPS results. The production task role and environment were released on September 26, 2026.

## Gateway setup and production release

1. In `us-east-1`, create a dedicated `ProspectWebSearchGatewayRole` with `bedrock-agentcore.amazonaws.com` trust. The deployed trust is constrained to account `<aws-account-id>` and this Gateway's exact ARN.
2. Give that role `bedrock-agentcore:InvokeGateway` on this Gateway's exact ARN and `bedrock-agentcore:InvokeWebSearch` on `arn:aws:bedrock-agentcore:us-east-1:aws:tool/web-search.v1`. [AWS connector setup](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-add-target-api-target-config.html#gateway-target-connector-web-search-tool).
3. Create the Gateway with MCP and IAM inbound authorization:

   ```sh
   aws bedrock-agentcore-control create-gateway --region us-east-1 --name prospect-web-search --role-arn arn:aws:iam::<aws-account-id>:role/ProspectWebSearchGatewayRole --protocol-type MCP --protocol-configuration '{"mcp":{"supportedVersions":["2025-11-25"]}}' --authorizer-type AWS_IAM
   ```

4. Once it is ready, use the returned Gateway ID to create the native search target:

   ```sh
   aws bedrock-agentcore-control create-gateway-target --region us-east-1 --gateway-identifier "$GATEWAY_ID" --name web-search-tool --target-configuration '{"mcp":{"connector":{"source":{"connectorId":"web-search"},"configurations":[{"name":"WebSearch","parameterValues":{}}]}}}' --credential-provider-configurations '[{"credentialProviderType":"GATEWAY_IAM_ROLE"}]'
   ```

5. Attach only `bedrock-agentcore:InvokeGateway` on `<prospect-web-search-gateway-arn>` to the Prospect application task role `<application-task-role-arn>`. Set `PROSPECT_WEB_SEARCH_GATEWAY_URL=<prospect-web-search-gateway-url>`, `PROSPECT_WEB_SEARCH_TOOL_NAME=web-search-tool___WebSearch`, and `PROSPECT_WEB_SEARCH_REGION=us-east-1` on the platform server task. Do not expose these variables to browser JavaScript. Use the existing AWS role credentials, with no API key.
6. The reviewed private release client image is deployed to ECS cluster `<ecs-cluster-name>`, service `<ecs-service-name>`, task `<task-definition-family>:<revision>`, image digest `<image-digest>`. The service reached a steady state with 2/2 new tasks. Signed-out production requests to the agent and admin summary were denied, and Prospect redirected to sign-in. An authenticated end-to-end web search remains to be checked in the browser. Roll back to the previous task-definition revision if needed.

The app caps results at five per search, allows four web searches per question, and limits each account to fifty searches per UTC day using a two-day operational quota counter. Do Not Track suppresses behavioral event storage even for server-side web searches; the short-lived counter still enforces cost limits. This is an application cost guard, not an AWS account-level budget. Set an AWS Budget alert for AgentCore Gateway and Web Search charges before production rollout. [AWS pricing](https://aws.amazon.com/bedrock/agentcore/pricing/) currently lists Web Search at $7 per 1,000 queries, plus Gateway usage.

## Usage data

Prospect records attention time for Discovery's globe/list, project dossier tabs, and Source workspace; Discovery search terms submitted by Enter or focus change (not keystrokes); project opens and favorite changes; agent question counts; and public search terms. Existing chat sessions retain the full conversation; this event stream does not duplicate prompts or answers. Events are linked to the authenticated account and organization, omit IP/device identifiers, redact email addresses and phone numbers from stored searches, and expire after 90 days. Source snippets and result pages are not stored in analytics. The browser honors Do Not Track; both usage endpoints honor the DNT request header. The write endpoint enforces same-origin JSON requests and caps each account at 250 usage events per UTC day. Authorized administrators can read aggregate organization/time-window screen attention, submitted search terms, and project interest at `/api/admin/products/studioiq/usage-summary?days=30`; it returns no chat prompts or answer text. The usage stream is for product analysis and sourcing prioritization; it is not a reinforcement-learning training pipeline. A later training pipeline would need explicit data selection, evaluation, and user controls.

AWS requires keeping citations with outputs that use its Web Search results and prohibits bulk storage of search content. The MP prompt enforces cited answers; review this in the live search acceptance test. [AWS Web Search acceptable use](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-web-search-tool.html#gateway-target-connector-web-search-tool-acceptable-use).
