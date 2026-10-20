import { defineInstructions } from "eve/instructions";
import { contentfulTarget } from "../lib/contentful.js";

const { spaceId, environmentId } = contentfulTarget();

/**
 * The Contentful tools never see the space or environment (the connection
 * supplies them), so the model learns them here to build the entry link.
 * Resolved at build time, so a missing or `master` target fails the build.
 */
export default defineInstructions({
  content: `# Contentful target

You work in Contentful space \`${spaceId}\`, environment \`${environmentId}\`. Link to an entry as:
https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/{entryId}`,
});
