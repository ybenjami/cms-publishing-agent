# cms-publishing-agent

A proof-of-concept AI agent that prepares content in [Contentful](https://www.contentful.com) but never publishes it. You ask in plain language, it writes a draft entry, and a person reviews and publishes it in Contentful.

![A Slack DM asking the agent to add a news article from a draft, the private prompt to sign in to Contentful, and the agent's reply with a link to the new draft and a note on what was left out](docs/slack-request.png)

It's built with [eve](https://eve.dev), Vercel's agent framework, and talks to Contentful through Contentful's hosted MCP server. You can use it from eve's terminal UI or from Slack.

This is a POC, not a product: it does the five things below and nothing more.

## What it does

1. You ask in plain language, for example "add a blog post about X from this draft".
2. It reads the content model: content types, required fields, and locales.
3. It maps the request to the right content type and fields, then creates or updates a **draft** entry.
4. It replies with a link to the entry in Contentful and a short note on anything it couldn't fit or needs clarified.
5. A person reviews and publishes in Contentful. The agent never publishes.

## Behavior rules

These live in [`agent/instructions.md`](agent/instructions.md). The [evals](#evals) check all of them except validations and references.

- **More information than the content type holds:** fill what fits, leave out what doesn't, and say what was left out. Don't fail, and don't ask a dozen questions.
- **One field, one purpose:** details like an author, a credit or a sponsor never get folded into body text. If no field fits, they're left out and listed in the reply.
- **Keep the requester's words:** text goes into fields as written. Derived fields like a slug or a summary only restate the request.
- **Ambiguous content type or target entry:** ask one short question before creating or changing anything.
- **Required fields:** never invent a value. The draft is created without it and the missing fields are listed, since Contentful only enforces required fields at publish time.
- **Validations and references:** values respect each field's validations, and references link only to entries found by search.
- **Updates to published entries:** the reply says the live version stays unchanged until someone publishes.
- **Nothing that matters is dropped silently.** Leaving out an optional field that doesn't apply is fine.

## Guardrails

The "never publish" rule is enforced by configuration, not by the prompt.

- **Tool allow-list.** Contentful's MCP server offers 85 tools, including publish, unpublish, archive, delete, and content type, environment, and release management. The connection in [`agent/connections/contentful.ts`](agent/connections/contentful.ts) exposes only eight: `get_initial_context`, `list_content_types`, `get_content_type`, `list_locales`, `search_entries`, `get_entry`, `create_entry`, and `update_entry`. The model can't discover or call anything else.
- **Pinned space and environment.** The model never chooses where to write. eve removes `spaceId` and `environmentId` from every tool's schema and fills them in from the `CONTENTFUL_SPACE_ID` and `CONTENTFUL_ENVIRONMENT_ID` environment variables. The agent refuses to build or run when the environment is `master`, so point them at a sandbox environment.
- **No other tools.** eve's optional built-in tools (shell, file, web, and subagent) are turned off in [`agent/agent.ts`](agent/agent.ts), so a pasted draft can't steer the agent toward a shell or the open web.
- **Per-user sign-in.** Each person signs in to Contentful as themselves (OAuth through [Vercel Connect](https://vercel.com/kb/guide/vercel-connect)), so the agent can only do what that person's Contentful role allows. In Slack, the sign-in link is sent privately to the person who asked.

## How it's built

| File                                                                                 | What it does                                                                                                                                              |
| ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`agent/agent.ts`](agent/agent.ts)                                                   | The model (`openai/gpt-6-luna-fast` through Vercel AI Gateway), with eve's optional built-in tools turned off so only the Contentful tools are available. |
| [`agent/instructions.md`](agent/instructions.md)                                     | The workflow and behavior rules.                                                                                                                          |
| [`agent/instructions/contentful-target.ts`](agent/instructions/contentful-target.ts) | Tells the model which space and environment it works in, so it can build the entry link. Built from the environment variables at build time.              |
| [`agent/connections/contentful.ts`](agent/connections/contentful.ts)                 | Contentful's MCP server (`https://mcp.contentful.com/mcp`), Vercel Connect auth, the tool allow-list, and the pinned space and environment.               |
| [`agent/lib/contentful.ts`](agent/lib/contentful.ts)                                 | The MCP URL and the target space and environment, read from the environment variables and checked once for both files above.                              |
| [`agent/channels/eve.ts`](agent/channels/eve.ts)                                     | eve's own channel (terminal UI and HTTP). In local development, treats you as a user so the Contentful sign-in can run, and lets evals stub tool results. |
| [`agent/channels/slack.ts`](agent/channels/slack.ts)                                 | Slack mentions and DMs through a Vercel Connect Slack app.                                                                                                |
| [`evals/`](evals)                                                                    | Evals for the behavior rules.                                                                                                                             |

## Run it yourself

### Prerequisites

- **Node.js 24** (see [`.nvmrc`](.nvmrc)).
- **The Vercel CLI** (`npm i -g vercel`), since setup uses `vercel connect` and `vercel env`.
- **A Vercel account** with [AI Gateway](https://vercel.com/docs/ai-gateway) credits. The free tier doesn't include the model this agent uses; add paid credits on the team that owns the project.
- **A Contentful space** with a non-`master` environment to write to, and the Contentful MCP app installed in it.
- **Optional: a Slack workspace** where you can install apps.

Tested with eve 0.81. eve is in public preview, so APIs may change.

### Set up

1. Install dependencies and link a Vercel project:

   ```bash
   nvm use
   npm install
   npx eve link
   ```

2. Create the Contentful connector in Vercel Connect:

   ```bash
   vercel connect create mcp.contentful.com --name <your-name>
   ```

   Its UID is `mcp.contentful.com/<your-name>`. Unless you used `cms-publishing-agent`, put yours in [`agent/connections/contentful.ts`](agent/connections/contentful.ts).

3. Set the space and environment (see [`.env.example`](.env.example)), then pull them into `.env.local`:

   ```bash
   vercel env add CONTENTFUL_SPACE_ID
   vercel env add CONTENTFUL_ENVIRONMENT_ID
   vercel env pull
   ```

4. Start the agent:

   ```bash
   npm run dev
   ```

   Ask it something like "List the content types and locales." The first time, it asks you to sign in to Contentful. Choose only the space and environment you set above.

### Add Slack

```bash
npx eve add channel/slack
npx eve deploy
```

Setup creates a Slack app through Vercel Connect for the connector named in [`agent/channels/slack.ts`](agent/channels/slack.ts) (change it first if you want a different name) and asks you to install it in a workspace. Slack events reach the deployed agent, not your local one, so test Slack after deploying.

### Evals

Sign in to Contentful once through `npm run dev` first (finish a request that asks you to). Then, with the dev server still running:

```bash
npm run eval -- --url http://127.0.0.1:2000
```

`npm run eval` without `--url` won't start while a dev server is running for the project.

There are five evals. Four cover extra information beyond the content type, a missing required field, an ambiguous content type, and updating an existing entry. The fifth sends a multi-sentence draft for an Announcement (a headline and a long-text field, no rich text body) and checks that every substantive sentence is saved while the photo credit, which has no field, is left out and reported. Every Contentful call is stubbed with a small fixture content model ([`evals/fixtures/contentful.ts`](evals/fixtures/contentful.ts)), so evals are repeatable and never write to Contentful. eve still lists the connection's tools live, which is why they need your Contentful sign-in. They do call the live model, so each run uses AI Gateway credits.

## Known issues

Found while building this; each one notes what the project does about it.

- **Contentful tokens need a resource indicator.** Without one, Contentful issues a token for its internal origin and the MCP server rejects it with 401 "Token audience does not match resource server". The connection passes `tokenParams: { resources: ["https://mcp.contentful.com/mcp"] }` to fix it.
- **A new Contentful sign-in revokes the same person's earlier token.** If you use both the terminal UI and Slack, you'll sign in again each time you switch. The agent asks for the new sign-in on its own.
- **Contentful's MCP server listed all 85 tools** for this project's sign-in, including publish and delete. The connection's allow-list is what keeps them away from the model; don't rely on the server to hide them.
- **eve's optional built-in tools can distract the model.** Before `defaultTools: false`, the model in `eve dev` tried eve's `bash` tool and self-modification agent before the Contentful tools, and eve then added `just-bash` and `microsandbox` to `package.json`. The agent now turns those tools off. If eve's development extensions still get in the way, run `eve dev --no-default-extensions`.
- **`eve remote invoke --resume` (eve 0.81) rejects its own output after a sign-in.** The paused result has extra fields that the resume schema doesn't allow. Keep only `authorization`, `description`, `name`, and `webhookUrl` on each authorization before resuming.

## How this was built

Built with Claude Code as a pair programmer. The architecture, guardrails, and behavior rules are my decisions; the commit history shows how they evolved.

## License

[MIT](LICENSE)
