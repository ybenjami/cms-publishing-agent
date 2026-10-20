# Bugs to fix

Running list of problems found while building this POC. Each item says what
happens, what we do about it today, and what fixing it means.

## Open

- **`eve remote invoke --resume` rejects its own output (eve 0.81).** After a
  connection sign-in, the paused result lists authorizations with extra fields
  (`grant`, `principal`, `sequence`, …) that the strict resume schema does not
  allow, so `--resume` fails with "Resume JSON is not a valid resumable eve
  remote invoke result." Workaround: keep only `authorization`, `description`,
  `name`, and `webhookUrl` on each authorization before resuming. Fix: report
  upstream to eve.
- **Model detours through eve's bundled dev extensions.** In `eve dev`, the
  model handed the first Contentful request to the self-modification agent,
  registry search, and `bash` before calling the Contentful tools. Fix: check
  whether the step 6 instructions stop it; otherwise run dev with
  `--no-default-extensions`.
- **Local `bash` sandbox fails to start.** Every `bash` call in `eve dev`
  fails with "Failed to prepare microsandbox [database] … Migration file …
  is missing". Not needed by this agent. Fix: clear the local microsandbox
  state or report upstream if it persists.
- **Contentful's server-side MCP app config does not filter `tools/list`.**
  The live server lists all 85 tools, including publish, delete, environment,
  and release tools. It may still refuse them at call time (untested). The
  connection's `tools.allow` is the only layer verified to work. Fix: confirm
  the app config on the sandbox environment, then test a blocked call outside
  the agent.
- **Unused Vercel Connect grants.** The first `vercel connect token` grant
  (bound to the wrong audience) and a test grant for `local-developer`
  without an issuer still exist. Fix: `vercel connect revoke-tokens` before
  open-sourcing.

## Worked around

- **Contentful issues tokens for the wrong audience.** Without an RFC 8707
  resource indicator, the token is bound to Contentful's internal
  workers.dev origin and the MCP server rejects it with 401 "Token audience
  does not match resource server". Fixed in
  `agent/connections/contentful.ts` with
  `tokenParams: { resources: ["https://mcp.contentful.com/mcp"] }`. Worth
  reporting to Contentful and Vercel.
