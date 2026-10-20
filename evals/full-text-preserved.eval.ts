import { defineEval } from "eve/evals";
import { includes, satisfies } from "eve/evals/expect";
import {
  contentfulStubs,
  type CreateEntryInput,
  exhibitUpdate,
  inputMatching,
} from "./fixtures/contentful.js";

/** One phrase from each substantive sentence of the draft below. */
const draftPhrases = [
  "Penguin Point reopens Dec 6",
  "14 African penguins",
  "deeper pool",
  "new nesting area",
  "Feeding talks run daily at 2pm",
  "J. Park",
];

export default defineEval({
  description:
    "A multi-sentence draft for a content type without a rich text body: every substantive sentence is saved in a field or named in the reply.",
  async test(t) {
    const session = await t.session({
      stubs: contentfulStubs({ contentTypes: [exhibitUpdate] }),
    });
    const turn = await session.send(
      "Add an exhibit update from this draft: 'Penguin Point reopens Dec 6 after a fall refresh. The colony of 14 African penguins now has a deeper pool and a new nesting area. Feeding talks run daily at 2pm. Photo credit: J. Park.'",
    );

    turn.expectOk();
    turn.calledTool("contentful__create_entry", {
      count: 1,
      input: inputMatching<CreateEntryInput>(
        ({ contentTypeId }) => contentTypeId === exhibitUpdate.sys.id,
      ),
    });

    const { fields } = turn.requireToolCall("contentful__create_entry")
      .input as unknown as CreateEntryInput;
    const saved = JSON.stringify(fields);
    const reply = turn.message ?? "";
    for (const phrase of draftPhrases) {
      t.check(
        phrase,
        satisfies(
          (value: string) => saved.includes(value) || reply.includes(value),
          "saved in a field or named in the reply",
        ),
      ).label(phrase);
    }
    t.check(saved, includes("deeper pool and a new nesting area")).label("long text kept verbatim");
  },
});
