import { config, collection, fields } from '@keystatic/core';

// Question schema — reused for easy/medium/hard arrays
const questionSchema = fields.object({
  id: fields.text({ label: 'Question ID' }),
  type: fields.select({
    label: 'Question Type',
    options: [
      { label: 'Multiple Choice (MCQ)', value: 'mcq' },
      { label: 'Short Answer', value: 'short' },
      { label: 'Fill in the Blank', value: 'fill' },
      { label: 'Long Answer', value: 'long' },
    ],
    defaultValue: 'mcq',
  }),
  question: fields.text({ label: 'Question', multiline: true }),
  options: fields.array(fields.text({ label: 'Option' }), {
    label: 'Options (MCQ only — leave empty for Short Answer / Fill / Long Answer)',
    itemLabel: (props) => props.value || 'Option',
  }),
  answer: fields.text({ label: 'Answer', multiline: true }),
  explanation: fields.text({ label: 'Explanation', multiline: true }),
});

export default config({
  storage:
    process.env.KEYSTATIC_GITHUB_CLIENT_ID
      ? {
          kind: 'github',
          repo: {
            owner: process.env.NEXT_PUBLIC_GITHUB_OWNER as string,
            name: process.env.NEXT_PUBLIC_GITHUB_REPO as string,
          },
        }
      : { kind: 'local' },

  ui: {
    brand: {
      name: 'Anjana Dalal Academy — Content CMS',
    },
  },

  collections: {
    // ─── Chapter Notes (MDX) ─────────────────────────────────────────────────
    // Each chapter folder has an index.mdx. This collection lets teachers edit
    // chapter notes through a visual editor without touching code.
    chapterNotes: collection({
      label: 'Chapter Notes',
      path: 'content/**/',
      slugField: 'title',
      format: {
        contentField: 'content',
      },
      schema: {
        title: fields.slug({ name: { label: 'Chapter Title' } }),
        content: fields.mdx({
          label: 'Chapter Notes',
        }),
      },
    }),

    // ─── Worksheets (JSON) ────────────────────────────────────────────────────
    // Each chapter folder has a worksheet.json with topics and questions.
    // Teachers can add/edit/reorder questions through the CMS UI.
    worksheets: collection({
      label: 'Worksheets',
      path: 'content/**/worksheet',
      slugField: 'chapterRef',
      format: { data: 'json' },
      schema: {
        chapterRef: fields.slug({ name: { label: 'Chapter Reference' } }),
        topics: fields.array(
          fields.object({
            topic: fields.text({ label: 'Topic Name' }),
            easy: fields.array(questionSchema, {
              label: 'Easy Questions',
              itemLabel: (props) =>
                props.fields.question.value.substring(0, 60) || 'New Question',
            }),
            medium: fields.array(questionSchema, {
              label: 'Medium Questions',
              itemLabel: (props) =>
                props.fields.question.value.substring(0, 60) || 'New Question',
            }),
            hard: fields.array(questionSchema, {
              label: 'Hard Questions',
              itemLabel: (props) =>
                props.fields.question.value.substring(0, 60) || 'New Question',
            }),
          }),
          {
            label: 'Topics',
            itemLabel: (props) => props.fields.topic.value || 'New Topic',
          }
        ),
      },
    }),
  },
});
