import { defineEval } from "eve/evals";
import { contentfulStubs } from "./fixtures/contentful.js";

export default defineEval({
  description:
    "A request that fits more than one content type: ask before creating or changing anything.",
  async test(t) {
    const session = await t.session({ stubs: contentfulStubs() });
    const turn = await session.send(
      "Add an announcement that our winter opening hours start December 1: 10am to 4pm daily.",
    );

    turn.expectOk();
    turn.notCalledTool("contentful__create_entry");
    turn.notCalledTool("contentful__update_entry");
    t.judge(
      "The reply asks whether to create a blog post or a news article before making any change.",
    ).gate(0.7);
  },
});
