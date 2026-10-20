/** Contentful's hosted MCP server. */
export const CONTENTFUL_MCP_URL = "https://mcp.contentful.com/mcp";

export interface ContentfulTarget {
  spaceId: string;
  environmentId: string;
}

/**
 * The one space and environment the agent may write to, from
 * `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ENVIRONMENT_ID`. Throws when either is
 * missing, or when the environment is `master`: drafts belong in a sandbox
 * environment, never in the one the live site reads from.
 */
export function contentfulTarget(): ContentfulTarget {
  const spaceId = process.env.CONTENTFUL_SPACE_ID;
  const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID;
  if (!spaceId || !environmentId) {
    throw new Error("CONTENTFUL_SPACE_ID and CONTENTFUL_ENVIRONMENT_ID must be set.");
  }
  if (environmentId === "master") {
    throw new Error(
      "CONTENTFUL_ENVIRONMENT_ID is master. Point it at a sandbox environment instead.",
    );
  }
  return { spaceId, environmentId };
}
