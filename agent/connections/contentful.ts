import { connect } from "@vercel/connect/eve";
import { defineMcpClientConnection } from "eve/connections";

/**
 * Contentful's hosted MCP server, authorized per user through Vercel Connect.
 *
 * The allow-list below is the agent's main guardrail: the model can only
 * discover and call these tools. Publishing, unpublishing, archiving,
 * deleting, and every content type, environment, and release tool are left
 * out, so the agent cannot take them no matter what it is asked.
 */
export default defineMcpClientConnection({
  url: "https://mcp.contentful.com/mcp",
  description:
    "Contentful CMS: read the content model and locales, find entries, and create or update draft entries.",
  // Connector created with `vercel connect create mcp.contentful.com`.
  auth: connect({
    connector: "mcp.contentful.com/cms-publishing-agent",
    // Without an explicit resource indicator, Contentful issues a token for
    // its internal origin and the MCP server rejects it (audience mismatch).
    tokenParams: { resources: ["https://mcp.contentful.com/mcp"] },
  }),
  tools: {
    allow: [
      "get_initial_context",
      "list_content_types",
      "get_content_type",
      "list_locales",
      "search_entries",
      "get_entry",
      "create_entry",
      "update_entry",
    ],
  },
});
