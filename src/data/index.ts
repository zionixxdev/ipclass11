import raw1 from './content/chapter-1.json';
import raw2 from './content/chapter-2.json';
import raw3 from './content/chapter-3.json';
import raw4 from './content/chapter-4.json';
import raw5 from './content/chapter-5.json';
import raw6 from './content/chapter-6.json';
import raw7 from './content/chapter-7.json';
import raw8 from './content/chapter-8.json';
import type { Chapter, Question, Table, Topic } from './types';

interface ChapterFile {
  chapter: { id: string; number: number; title: string; summary: string };
  topics: Topic[];
  questions: Question[];
}

const files = [raw1, raw2, raw3, raw4, raw5, raw6, raw7, raw8] as unknown as ChapterFile[];

// Content authored across chapters occasionally uses a single object instead of
// a one-item array, or alternative table keys ("columns"/"caption"). Normalise
// defensively so the UI can rely on one shape.
function asArray<T>(v: unknown): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? (v as T[]) : [v as T];
}

function normTable(t: any): Table {
  return {
    title: t?.title || t?.caption || '',
    headers: Array.isArray(t?.headers) ? t.headers : Array.isArray(t?.columns) ? t.columns : [],
    rows: Array.isArray(t?.rows) ? t.rows : [],
  };
}

function normTopic(t: any): Topic {
  const c = t?.content || {};
  return {
    id: t.id,
    title: t.title,
    content: {
      hinglish: c.hinglish || '',
      formalDefinition: c.formalDefinition || '',
      keywords: asArray<string>(c.keywords),
      examples: asArray<string>(c.examples),
      tables: asArray<any>(c.tables).map(normTable),
      diagrams: asArray<string>(c.diagrams),
      differences: asArray<any>(c.differences).map(normTable),
      pythonSyntax: c.pythonSyntax,
      codeExamples: asArray<any>(c.codeExamples).map((e) => ({ code: e?.code || '', output: e?.output, explanation: e?.explanation })),
      commonMistakes: asArray<string>(c.commonMistakes),
      examNotes: asArray<string>(c.examNotes),
      faqs: asArray<any>(c.faqs).map((f) => ({ q: f?.q || '', a: f?.a || '' })),
      quiz: asArray<any>(c.quiz).map((q) => ({ question: q?.question || '', options: asArray<string>(q?.options), answer: typeof q?.answer === 'number' ? q.answer : 0, explanation: q?.explanation || '' })),
      checklist: asArray<string>(c.checklist),
    },
  };
}

function normQuestion(q: any): Question {
  const out: Question = { ...q };
  if (q.options != null) out.options = asArray<string>(q.options);
  if (q.optionExplanations != null) out.optionExplanations = asArray<string>(q.optionExplanations);
  if (q.acceptedAnswers != null) out.acceptedAnswers = asArray<string>(q.acceptedAnswers);
  if (q.matchPairs != null) out.matchPairs = asArray<any>(q.matchPairs).map((p) => ({ left: p?.left ?? '', right: p?.right ?? '' }));
  if (q.executionSteps != null) out.executionSteps = asArray<string>(q.executionSteps);
  if (q.hints != null) out.hints = asArray<string>(q.hints);
  if (q.testCases != null) out.testCases = asArray<any>(q.testCases).map((t) => ({ input: t?.input ?? '', output: t?.output ?? '' }));
  if (q.rubric != null) out.rubric = asArray<string>(q.rubric);
  if (q.keywords != null) out.keywords = asArray<string>(q.keywords);
  if (q.relatedConcepts != null) out.relatedConcepts = asArray<string>(q.relatedConcepts);
  if (q.lineExplanations != null) out.lineExplanations = asArray<any>(q.lineExplanations).map((l) => ({ line: l?.line ?? '', explanation: l?.explanation ?? '' }));
  if (q.caseStudy) {
    const cs = q.caseStudy;
    out.caseStudy = {
      passage: cs.passage || '',
      table: cs.table ? normTable(cs.table) : undefined,
      subQuestions: asArray<any>(cs.subQuestions).map((s) => ({
        question: s?.question || '',
        kind: s?.kind === 'mcq' ? 'mcq' : 'short',
        options: s?.options != null ? asArray<string>(s.options) : undefined,
        answer: String(s?.answer ?? ''),
        explanation: s?.explanation || '',
        marks: typeof s?.marks === 'number' ? s.marks : 1,
      })),
    };
  }
  return out;
}

export const chapters: Chapter[] = files
  .map((f) => ({ ...f.chapter, topics: (f.topics || []).map(normTopic) }))
  .sort((a, b) => a.number - b.number);

export const questions: Question[] = files.flatMap((f) => (f.questions || []).map(normQuestion));

export const questionsByChapter: Record<string, Question[]> = {};
export const questionsByTopic: Record<string, Question[]> = {};
export const topicIndex: Record<string, { topic: Topic; chapter: Chapter }> = {};

for (const ch of chapters) {
  questionsByChapter[ch.id] = [];
  for (const t of ch.topics) {
    questionsByTopic[t.id] = [];
    topicIndex[t.id] = { topic: t, chapter: ch };
  }
}
for (const q of questions) {
  (questionsByChapter[q.chapterId] ||= []).push(q);
  (questionsByTopic[q.topicId] ||= []).push(q);
}

export function getChapter(id: string): Chapter | undefined {
  return chapters.find((c) => c.id === id);
}

export function getTopic(topicId: string): Topic | undefined {
  return topicIndex[topicId]?.topic;
}

export const allTopics: Topic[] = chapters.flatMap((c) => c.topics);

export const totalTopicCount = allTopics.length;
export const totalQuestionCount = questions.length;
