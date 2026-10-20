import { defineEval } from "eve/evals";
import { contentfulStubs } from "./fixtures/contentful.js";

type CreateEntryInput = { contentTypeId: string; fields: Record<string, unknown> };

export default defineEval({
  description:
    "A request missing a required field: create the draft without inventing the value, and list the missing field.",
  async test(t) {
    const session = await t.session({ stubs: contentfulStubs() });
    const turn = await session.send(
      'Add a blog post titled "Meet Our New Otters". I\'ll send the text later.',
    );

    turn.expectOk();
    turn.calledTool("contentful__create_entry", {
      count: 1,
      input: (value) => {
        const input = value as unknown as CreateEntryInput;
        return (
          input.contentTypeId === "blogPost" && "title" in input.fields && !("body" in input.fields)
        );
      },
    });
    turn.messageIncludes("entries/newEntry1");
    t.judge("The reply says the required Body field is still missing.").gate(0.7);
  },
});
