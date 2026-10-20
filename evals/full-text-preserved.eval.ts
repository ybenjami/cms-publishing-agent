import { defineEval } from "eve/evals";
import { includes, satisfies } from "eve/evals/expect";
import {
  announcement,
  contentfulStubs,
  type CreateEntryInput,
  inputMatching,
  newEntryId,
} from "./fixtures/contentful.js";

/** One phrase from each substantive sentence of the draft. */
const keptPhrases = ["14 African penguins", "deeper pool", "nesting area", "2pm"];

/** A photo credit has no field on an announcement, so it must stay out of the entry. */
const photoCredit = "J. Park";

export default defineEval({
  description:
    "A multi-sentence draft for a content type without a rich text body: every substantive sentence is saved, and a detail with no field is left out and reported.",
  async test(t) {
    const session = await t.session({
      stubs: contentfulStubs({ contentTypes: [announcement] }),
    });
    const turn = await session.send(
      "Add an announcement from this draft: 'Penguin Point reopens Dec 6 after a fall refresh. The colony of 14 African penguins now has a deeper pool and a new nesting area. Feeding talks run daily at 2pm. Photo credit: J. Park.'",
    );

    turn.expectOk();
    turn.calledTool("contentful__create_entry", {
      count: 1,
      input: inputMatching<CreateEntryInput>(
        ({ contentTypeId }) => contentTypeId === announcement.sys.id,
      ),
    });

    const { fields } = turn.requireToolCall("contentful__create_entry")
      .input as unknown as CreateEntryInput;
    const savedText = JSON.stringify(fields);
    for (const phrase of keptPhrases) {
      t.check(savedText, includes(phrase)).label(`saved: ${phrase}`);
    }
    t.check(
      savedText,
      satisfies((text: string) => !text.includes(photoCredit), "photo credit left out of fields"),
    ).label("one field, one purpose");

    turn.messageIncludes(`entries/${newEntryId}`);
    t.judge("The reply says the photo credit was left out because no field fits it.").gate(0.7);
  },
});
