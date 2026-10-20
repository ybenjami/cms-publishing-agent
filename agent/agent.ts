import { defineAgent } from "eve";

export default defineAgent({
  model: "openai/gpt-6-luna-fast",
  reasoning: "high",
  // The agent only needs its Contentful tools. Turning off eve's optional
  // built-ins (bash, file, web, and subagent tools) keeps a pasted draft from
  // steering it toward a shell or the open web.
  defaultTools: false,
});
