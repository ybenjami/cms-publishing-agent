import { defineEval } from "eve/evals";
import {
  contentfulStubs,
  type CreateEntryInput,
  inputMatching,
  newEntryId,
} from "./fixtures/contentful.js";

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
      input: inputMatching<CreateEntryInput>(
        ({ contentTypeId, fields }) =>
          contentTypeId === "blogPost" && "title" in fields && !("body" in fields),
      ),
    });
    turn.messageIncludes(`entries/${newEntryId}`);
    t.judge("The reply says the required Body field is still missing.").gate(0.7);
  },
});
