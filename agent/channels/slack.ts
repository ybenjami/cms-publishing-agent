import { connectSlackCredentials } from "@vercel/connect/eve";
import { slackChannel } from "eve/channels/slack";

/**
 * Slack app mentions and DMs, through a Vercel Connect Slack app. Each Slack
 * user is their own principal, so each person signs in to Contentful as
 * themselves; eve sends that sign-in link to them privately.
 */
export default slackChannel({
  credentials: connectSlackCredentials("slack/cms-publishing-agent"),
});
