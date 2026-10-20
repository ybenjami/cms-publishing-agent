/**
 * A small, fixed Contentful content model for evals. Every Contentful call is
 * stubbed, so evals are repeatable and never write to a real space. The
 * connection still lists its tools live, so `eve eval` needs a Contentful
 * sign-in.
 */
import type { ToolStub, ToolStubOutcome } from "eve/evals";

type JsonValue = Extract<ToolStubOutcome, { response: unknown }>["response"];

/** Fixture objects are plain JSON; this tells TypeScript so. */
const json = (value: object) => value as JsonValue;

/** The input the agent sends to `contentful__create_entry`. */
export interface CreateEntryInput {
  contentTypeId: string;
  fields: Record<string, unknown>;
}

/** The input the agent sends to `contentful__update_entry`. */
export interface UpdateEntryInput {
  entryId: string;
  version: number;
  fields: Record<string, unknown>;
}

/**
 * Wraps a typed predicate as a `calledTool` input matcher. eve records tool
 * inputs as plain JSON, so the cast restores the shape the tool expects.
 */
export function inputMatching<Input>(predicate: (input: Input) => boolean) {
  return (value: object) => predicate(value as Input);
}

const blogPost = {
  sys: { id: "blogPost", type: "ContentType" },
  name: "Blog Post",
  description: "A post for the blog.",
  displayField: "title",
  fields: [
    {
      id: "title",
      name: "Title",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [],
    },
    {
      id: "slug",
      name: "Slug",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [{ unique: true }, { regexp: { pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$" } }],
    },
    {
      id: "excerpt",
      name: "Excerpt",
      type: "Symbol",
      required: false,
      localized: false,
      validations: [{ size: { max: 200 } }],
    },
    {
      id: "body",
      name: "Body",
      type: "RichText",
      required: true,
      localized: false,
      validations: [],
    },
    {
      id: "author",
      name: "Author",
      type: "Link",
      linkType: "Entry",
      required: false,
      localized: false,
      validations: [{ linkContentType: ["author"] }],
    },
    {
      id: "publishDate",
      name: "Publish Date",
      type: "Date",
      required: false,
      localized: false,
      validations: [],
    },
  ],
};

const newsArticle = {
  sys: { id: "newsArticle", type: "ContentType" },
  name: "News Article",
  description: "An article for the news section.",
  displayField: "headline",
  fields: [
    {
      id: "headline",
      name: "Headline",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [],
    },
    {
      id: "body",
      name: "Body",
      type: "RichText",
      required: true,
      localized: false,
      validations: [],
    },
    {
      id: "publishDate",
      name: "Publish Date",
      type: "Date",
      required: false,
      localized: false,
      validations: [],
    },
  ],
};

/**
 * A headline and one required long-text field: no rich text body, and no
 * author, credit, or image fields. Only the full-text eval uses it, so the
 * other evals see the same content model as before.
 */
export const announcement = {
  sys: { id: "announcement", type: "ContentType" },
  name: "Announcement",
  description: "A short announcement.",
  displayField: "headline",
  fields: [
    {
      id: "headline",
      name: "Headline",
      type: "Symbol",
      required: true,
      localized: false,
      validations: [],
    },
    {
      id: "details",
      name: "Details",
      type: "Text",
      required: true,
      localized: false,
      validations: [],
    },
  ],
};

const author = {
  sys: { id: "author", type: "ContentType" },
  name: "Author",
  description: "A person who writes posts.",
  displayField: "name",
  fields: [
    { id: "name", name: "Name", type: "Symbol", required: true, localized: false, validations: [] },
  ],
};

/** The ID the stubbed `create_entry` gives every new entry. */
export const newEntryId = "newEntry1";

export const blogPostFieldIds = blogPost.fields.map((field) => field.id);

/** The content model most evals use: two similar types and a reference target. */
const defaultContentTypes = [blogPost, newsArticle, author];

type ContentType = (typeof defaultContentTypes)[number] | typeof announcement;

/** An existing, published blog post for the update eval. */
export const springPlantSale = {
  sys: {
    id: "springPlantSale",
    type: "Entry",
    version: 7,
    publishedVersion: 6,
    contentType: { sys: { type: "Link", linkType: "ContentType", id: "blogPost" } },
  },
  fields: {
    title: { "en-US": "Spring Plant Sale" },
    slug: { "en-US": "spring-plant-sale" },
    excerpt: { "en-US": "Our annual plant sale is on April 26." },
    body: {
      "en-US": {
        nodeType: "document",
        data: {},
        content: [
          {
            nodeType: "paragraph",
            data: {},
            content: [
              {
                nodeType: "text",
                value: "Our annual plant sale is on April 26 in the greenhouse.",
                marks: [],
                data: {},
              },
            ],
          },
        ],
      },
    },
  },
};

/**
 * Stubs for reading the content model and writing entries. Pass
 * `contentTypes` to change the model the agent sees, and `entries` to control
 * what `search_entries` finds.
 */
export function contentfulStubs({
  contentTypes = defaultContentTypes as ContentType[],
  entries = [] as (typeof springPlantSale)[],
} = {}): ToolStub[] {
  return [
    {
      id: "initial-context",
      tool: "contentful__get_initial_context",
      outcome: { response: { instructions: "Use the Contentful tools to manage content." } },
    },
    {
      id: "list-content-types",
      tool: "contentful__list_content_types",
      outcome: { response: { total: contentTypes.length, items: contentTypes.map(json) } },
    },
    ...contentTypes.map(
      (contentType): ToolStub => ({
        id: `get-content-type-${contentType.sys.id}`,
        tool: "contentful__get_content_type",
        match: { contentTypeId: { const: contentType.sys.id } },
        outcome: { response: json(contentType) },
      }),
    ),
    {
      id: "list-locales",
      tool: "contentful__list_locales",
      outcome: {
        response: {
          total: 1,
          items: [
            { code: "en-US", name: "English (United States)", default: true, fallbackCode: null },
          ],
        },
      },
    },
    {
      id: "search-entries",
      tool: "contentful__search_entries",
      outcome: { response: { total: entries.length, items: entries.map(json) } },
    },
    {
      id: "get-entry-spring-plant-sale",
      tool: "contentful__get_entry",
      match: { entryId: { const: springPlantSale.sys.id } },
      outcome: { response: json(springPlantSale) },
    },
    {
      id: "create-entry",
      tool: "contentful__create_entry",
      outcome: { response: { sys: { id: newEntryId, type: "Entry", version: 1 } } },
    },
    {
      id: "update-entry",
      tool: "contentful__update_entry",
      outcome: {
        response: {
          sys: { id: springPlantSale.sys.id, type: "Entry", version: 8, publishedVersion: 6 },
        },
      },
    },
  ];
}
