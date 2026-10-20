import { defineEval } from "eve/evals";
import {
  blogPostFieldIds,
  contentfulStubs,
  type CreateEntryInput,
  inputMatching,
  newEntryId,
} from "./fixtures/contentful.js";

export default defineEval({
  description:
    "A request with more information than the content type holds: fill what fits, leave out the rest, and say what was left out.",
  async test(t) {
    const session = await t.session({ stubs: contentfulStubs() });
    const turn = await session.send(
      [
        "Add a blog post from this draft.",
        "Title: Behind the Scenes at the Aquarium",
        "Body: Every morning starts at 6am, when our team checks water quality in all 40 tanks.",
        "Tags: aquarium, behind the scenes, staff",
        "Featured image: https://example.com/images/aquarium-team.jpg",
        "Sponsor: Blue Wave Pools",
      ].join("\n"),
    );

    turn.expectOk();
    turn.calledTool("contentful__create_entry", {
      count: 1,
      input: inputMatching<CreateEntryInput>(
        ({ contentTypeId, fields }) =>
          contentTypeId === "blogPost" &&
          Object.keys(fields).every((id) => blogPostFieldIds.includes(id)) &&
          "title" in fields &&
          "body" in fields,
      ),
    });
    turn.messageIncludes(`entries/${newEntryId}`);
    t.judge(
      "The reply says the tags, the featured image, and the sponsor were left out of the entry.",
    ).gate(0.7);
  },
});
