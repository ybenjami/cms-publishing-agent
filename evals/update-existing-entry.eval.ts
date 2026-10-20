import { defineEval } from "eve/evals";
import {
  contentfulStubs,
  inputMatching,
  springPlantSale,
  type UpdateEntryInput,
} from "./fixtures/contentful.js";

export default defineEval({
  description:
    "A request to change an existing entry: find it, update it with the current version, and don't create a new one.",
  async test(t) {
    const session = await t.session({ stubs: contentfulStubs({ entries: [springPlantSale] }) });
    const turn = await session.send(
      'Update the "Spring Plant Sale" blog post: the sale moved to May 3.',
    );

    turn.expectOk();
    turn.notCalledTool("contentful__create_entry");
    turn.calledTool("contentful__update_entry", {
      count: 1,
      input: inputMatching<UpdateEntryInput>(
        ({ entryId, version, fields }) =>
          entryId === springPlantSale.sys.id &&
          version === springPlantSale.sys.version &&
          JSON.stringify(fields).includes("May 3"),
      ),
    });
    turn.messageIncludes(`entries/${springPlantSale.sys.id}`);
    t.judge(
      "The reply says the entry was updated and that the live, published version stays unchanged until someone publishes the changes.",
    ).gate(0.7);
  },
});
