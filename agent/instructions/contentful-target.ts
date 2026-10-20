import { defineInstructions } from "eve/instructions";

const spaceId = process.env.CONTENTFUL_SPACE_ID;
const environmentId = process.env.CONTENTFUL_ENVIRONMENT_ID;

if (!spaceId || !environmentId) {
  throw new Error(
    "CONTENTFUL_SPACE_ID and CONTENTFUL_ENVIRONMENT_ID must be set to build the agent.",
  );
}

/**
 * The Contentful tools never see the space or environment (the connection
 * supplies them), so the model learns them here to build the entry link.
 */
export default defineInstructions({
  content: `# Contentful target

You work in Contentful space \`${spaceId}\`, environment \`${environmentId}\`. Link to an entry as:
https://app.contentful.com/spaces/${spaceId}/environments/${environmentId}/entries/{entryId}`,
});
