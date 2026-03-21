import { config, collection, fields, type Collection } from '@keystatic/core';

// ─── Question schema — reused for easy/medium/hard arrays ─────────────────────
const questionSchema = fields.object({
  id: fields.text({
    label: 'Question ID',
    description: 'Auto-generated ID like ch1-t1-e1. Do not change unless necessary.',
  }),
  type: fields.select({
    label: 'Question Type',
    description: 'MCQ = multiple choice with options. Fill = blank to fill. Short/Long = written answers.',
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
    label: 'Options (MCQ only)',
    description: 'Add 4 options for MCQ questions. Leave empty for other question types.',
    itemLabel: (props) => props.value || 'Option',
  }),
  answer: fields.text({
    label: 'Correct Answer',
    multiline: true,
    description: 'For MCQ, write the exact text of the correct option.',
  }),
  explanation: fields.text({
    label: 'Explanation',
    multiline: true,
    description: 'Explain why this is the correct answer. Shown to students after they attempt.',
  }),
});

// ─── Class/Subject definitions ────────────────────────────────────────────────
const classSubjects = [
  { classId: 'class-1', subject: 'maths', label: 'Class 1 Maths', icon: '🔢' },
  { classId: 'class-2', subject: 'maths', label: 'Class 2 Maths', icon: '🔢' },
  { classId: 'class-3', subject: 'maths', label: 'Class 3 Maths', icon: '🔢' },
  { classId: 'class-3', subject: 'science', label: 'Class 3 Science', icon: '🔬' },
  { classId: 'class-4', subject: 'maths', label: 'Class 4 Maths', icon: '🔢' },
  { classId: 'class-4', subject: 'science', label: 'Class 4 Science', icon: '🔬' },
  { classId: 'class-5', subject: 'maths', label: 'Class 5 Maths', icon: '🔢' },
  { classId: 'class-5', subject: 'science', label: 'Class 5 Science', icon: '🔬' },
  { classId: 'class-6', subject: 'maths', label: 'Class 6 Maths', icon: '🔢' },
  { classId: 'class-6', subject: 'science', label: 'Class 6 Science', icon: '🔬' },
  { classId: 'class-7', subject: 'maths', label: 'Class 7 Maths', icon: '🔢' },
  { classId: 'class-7', subject: 'science', label: 'Class 7 Science', icon: '🔬' },
  { classId: 'class-8', subject: 'maths', label: 'Class 8 Maths', icon: '🔢' },
  { classId: 'class-8', subject: 'science', label: 'Class 8 Science', icon: '🔬' },
  { classId: 'class-9', subject: 'maths', label: 'Class 9 Maths', icon: '🔢' },
  { classId: 'class-9', subject: 'science', label: 'Class 9 Science', icon: '🔬' },
  { classId: 'class-10', subject: 'maths', label: 'Class 10 Maths', icon: '🔢' },
  { classId: 'class-10', subject: 'science', label: 'Class 10 Science', icon: '🔬' },
] as const;

// ─── Helper: prettify slug into readable title ────────────────────────────────
// "chapter-1-finding-the-furry-cat" → "Chapter 1 — Finding the Furry Cat"
function prettifySlug(slug: string): string {
  return slug
    .replace(/^chapter-(\d+)-/, 'Ch $1 — ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Generate collections per class-subject ───────────────────────────────────
function makeNotesCollection(
  classId: string,
  subject: string,
  label: string,
  icon: string
): Collection<any, any> {
  return collection({
    label: `${icon} ${label} — Notes`,
    path: `content/${classId}/${subject}/*/`,
    slugField: 'title',
    format: { contentField: 'content' },
    entryLayout: 'content',
    columns: ['title'],
    schema: {
      title: fields.slug({
        name: {
          label: 'Chapter Title',
          description: 'The chapter title shown on the website.',
        },
      }),
      content: fields.mdx({
        label: 'Chapter Notes',
        description: 'Write or edit the chapter content. Use headings, bold text, and blockquotes.',
      }),
    },
  });
}

function makeWorksheetCollection(
  classId: string,
  subject: string,
  label: string,
  icon: string
): Collection<any, any> {
  return collection({
    label: `${icon} ${label} — Worksheets`,
    path: `content/${classId}/${subject}/*/worksheet`,
    slugField: 'chapterRef',
    format: { data: 'json' },
    columns: ['chapterRef'],
    schema: {
      chapterRef: fields.slug({
        name: {
          label: 'Chapter Reference',
          description: 'This links the worksheet to a chapter. Do not change.',
        },
      }),
      topics: fields.array(
        fields.object({
          topic: fields.text({
            label: 'Topic Name',
            description: 'The topic this group of questions covers (e.g. "Fractions", "Newton\'s Laws").',
          }),
          easy: fields.array(questionSchema, {
            label: 'Easy Questions',
            description: 'Basic recall and understanding. 3-5 questions recommended.',
            itemLabel: (props) =>
              props.fields.question.value.substring(0, 60) || 'New Question',
          }),
          medium: fields.array(questionSchema, {
            label: 'Medium Questions',
            description: 'Application and analysis. 2-3 questions recommended.',
            itemLabel: (props) =>
              props.fields.question.value.substring(0, 60) || 'New Question',
          }),
          hard: fields.array(questionSchema, {
            label: 'Hard Questions',
            description: 'Higher-order thinking and multi-step problems. 1-2 questions recommended.',
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
  });
}

function makeDiscussionCollection(
  classId: string,
  subject: string,
  label: string,
  icon: string
): Collection<any, any> {
  return collection({
    label: `${icon} ${label} — Discussions`,
    path: `content/${classId}/${subject}/*/discussion`,
    slugField: 'chapterRef',
    format: { contentField: 'content' },
    entryLayout: 'content',
    columns: ['chapterRef'],
    schema: {
      chapterRef: fields.slug({
        name: {
          label: 'Chapter Reference',
          description: 'This links the discussion to a chapter. Use the same slug as the chapter folder.',
        },
      }),
      content: fields.mdx({
        label: 'Discussion Content',
        description: 'Ravi-Kiran conversation explaining concepts with Indian daily-life examples.',
      }),
    },
  });
}

// ─── Build collections and navigation dynamically ─────────────────────────────
const collections: Record<string, Collection<any, any>> = {};
const navigation: Record<string, string[]> = {};

for (const { classId, subject, label, icon } of classSubjects) {
  const notesKey = `${classId}-${subject}-notes`;
  const worksheetsKey = `${classId}-${subject}-worksheets`;
  const discussionsKey = `${classId}-${subject}-discussions`;

  collections[notesKey] = makeNotesCollection(classId, subject, label, icon);
  collections[worksheetsKey] = makeWorksheetCollection(classId, subject, label, icon);
  collections[discussionsKey] = makeDiscussionCollection(classId, subject, label, icon);

  // Group by class in sidebar
  const classLabel = label.replace(/ (Maths|Science)$/, '');
  if (!navigation[classLabel]) navigation[classLabel] = [];
  navigation[classLabel].push(notesKey, worksheetsKey, discussionsKey);
}

// ─── Export config ────────────────────────────────────────────────────────────
export default config({
  storage:
    process.env.NODE_ENV === 'production'
      ? {
          kind: 'github',
          repo: {
            owner: process.env.NEXT_PUBLIC_GITHUB_OWNER ?? 'neerajsheoran',
            name: process.env.NEXT_PUBLIC_GITHUB_REPO ?? 'anjana-dalal-academy',
          },
          branchPrefix: 'content/',
        }
      : { kind: 'local' },

  ui: {
    brand: {
      name: 'Anjana Dalal Academy — Content CMS',
    },
    navigation,
  },

  collections,
});
