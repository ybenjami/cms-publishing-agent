import type { ToolStub, ToolStubOutcome } from "eve/evals";

type JsonValue = Extract<ToolStubOutcome, { response: unknown }>["response"];

/** Fixture objects are plain JSON; this tells TypeScript so. */
const json = (value: object) => value as JsonValue;

/**
 * A small, fixed Contentful content model for evals. Every Contentful call is
 * stubbed, so evals are repeatable and never write to a real space. The
 * connection still lists its tools live, so `eve eval` needs a Contentful
 * sign-in.
 */

const blogPost = {
  sys: { id: "blogPost", type: "ContentType" },
  name: "Blog Post",
  description: "A post for the blog.",
  displayField: "title",
  fields: [
    { id: "title", name: "Title", type: "Symbol", required: true, localized: false, validations: [] },
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
    { id: "body", name: "Body", type: "RichText", required: true, localized: false, validations: [] },
    {
      id: "author",
      name: "Author",
      type: "Link",
      linkType: "Entry",
      required: false,
      localized: false,
      validations: [{ linkContentType: ["author"] }],
    },
    { id: "publishDate", name: "Publish Date", type: "Date", required: false, localized: false, validations: [] },
  ],
};

const newsArticle = {
  sys: { id: "newsArticle", type: "ContentType" },
  name: "News Article",
  description: "An article for the news section.",
  displayField: "headline",
  fields: [
    { id: "headline", name: "Headline", type: "Symbol", required: true, localized: false, validations: [] },
    { id: "body", name: "Body", type: "RichText", required: true, localized: false, validations: [] },
    { id: "publishDate", name: "Publish Date", type: "Date", required: false, localized: false, validations: [] },
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

export const blogPostFieldIds = blogPost.fields.map((field) => field.id);

const contentTypes = [blogPost, newsArticle, author];

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
 * Stubs for reading the content model and writing entries. Pass `entries` to
 * control what `search_entries` finds.
 */
export function contentfulStubs({ entries = [] as (typeof springPlantSale)[] } = {}): ToolStub[] {
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
          items: [{ code: "en-US", name: "English (United States)", default: true, fallbackCode: null }],
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
      outcome: { response: { sys: { id: "newEntry1", type: "Entry", version: 1 } } },
    },
    {
      id: "update-entry",
      tool: "contentful__update_entry",
      outcome: {
        response: { sys: { id: springPlantSale.sys.id, type: "Entry", version: 8, publishedVersion: 6 } },
      },
    },
  ];
}
