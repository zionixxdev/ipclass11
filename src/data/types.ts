// ---------------------------------------------------------------------------
// Core data model for CompPrep 11.
// Content (chapters, topics, questions) lives in JSON files under src/data and
// is completely decoupled from the UI. New questions can be dropped in without
// touching any component logic.
// ---------------------------------------------------------------------------

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType =
  | 'mcq'
  | 'assertion'
  | 'truefalse'
  | 'fillblank'
  | 'match'
  | 'vsa'
  | 'sa'
  | 'la'
  | 'case'
  | 'output'
  | 'debug'
  | 'program'
  | 'numerical';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  mcq: 'MCQ',
  assertion: 'Assertion-Reason',
  truefalse: 'True / False',
  fillblank: 'Fill in the Blanks',
  match: 'Match the Following',
  vsa: 'Very Short Answer',
  sa: 'Short Answer',
  la: 'Long Answer',
  case: 'Case-Based',
  output: 'Output-Based',
  debug: 'Find & Correct Error',
  program: 'Write a Program',
  numerical: 'Numerical / Conversion',
};

export interface Table {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface CodeExample {
  code: string;
  output?: string;
  explanation?: string;
}

export interface FAQ {
  q: string;
  a: string;
}

export interface QuizItem {
  question: string;
  options: string[];
  answer: number; // index into options
  explanation: string;
}

/** The 13-part learning payload for a single subtopic. */
export interface TopicContent {
  hinglish: string; // beginner friendly Hinglish explanation
  formalDefinition: string; // exam-writable formal English definition
  keywords: string[];
  examples: string[];
  tables?: Table[];
  diagrams?: string[]; // textual / ascii / described diagrams
  differences?: Table[];
  pythonSyntax?: string;
  codeExamples?: CodeExample[];
  commonMistakes: string[];
  examNotes: string[];
  faqs: FAQ[];
  quiz: QuizItem[];
  checklist: string[];
}

export interface Topic {
  id: string;
  title: string;
  content: TopicContent;
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  summary: string;
  topics: Topic[];
}

// --- Questions --------------------------------------------------------------

export interface MatchPair {
  left: string;
  right: string;
}

export interface CaseSubQuestion {
  question: string;
  kind: 'mcq' | 'short';
  options?: string[];
  answer: string; // for mcq: option text; for short: model answer
  explanation: string;
  marks: number;
}

export interface TestCase {
  input: string;
  output: string;
}

export interface Question {
  id: string;
  chapterId: string;
  topicId: string;
  type: QuestionType;
  difficulty: Difficulty;
  marks: number;
  question: string;
  /** MCQ / assertion: exactly four options. */
  options?: string[];
  /** mcq: index of correct option (0-3). truefalse: 'True' | 'False'. */
  correctAnswer?: string | number;
  /** Why each incorrect option is wrong, parallel to options. */
  optionExplanations?: string[];
  /** Descriptive model answer. */
  modelAnswer?: string;
  /** Always required — teaches the concept. */
  explanation: string;
  /** Extra execution walk-through for output/debug/program questions. */
  executionSteps?: string[];
  /** Fill-in-the-blank alternatives accepted as correct. */
  acceptedAnswers?: string[];
  /** Assertion-Reason split. */
  assertion?: string;
  reason?: string;
  /** Correction shown when a True/False statement is false. */
  correction?: string;
  /** Match the following pairs. */
  matchPairs?: MatchPair[];
  /** Case-based study block. */
  caseStudy?: {
    passage: string;
    table?: Table;
    subQuestions: CaseSubQuestion[];
  };
  /** Programming question helpers. */
  hints?: string[];
  modelSolution?: string;
  lineExplanations?: { line: string; explanation: string }[];
  testCases?: TestCase[];
  /** Marking rubric / keywords. */
  rubric?: string[];
  keywords?: string[];
  relatedConcepts?: string[];
  /** Code snippet to display. */
  code?: string;
  /** Error classification for debug questions. */
  errorType?: 'syntax' | 'runtime' | 'logical';
  /** Numerical questions: unit label. */
  unit?: string;
}

// --- User activity ----------------------------------------------------------

export interface Attempt {
  questionId: string;
  chapterId: string;
  topicId: string;
  type: QuestionType;
  difficulty: Difficulty;
  correct: boolean | null; // null = self-evaluated / pending
  given: string;
  at: number; // epoch ms
  mode: string;
}

export interface MockResult {
  id: string;
  at: number;
  totalMarks: number;
  scoredMarks: number;
  objective: { correct: number; total: number };
  breakdown: { chapterId: string; correct: number; total: number }[];
  typeBreakdown: { type: QuestionType; correct: number; total: number }[];
  durationSec: number;
}

export interface Settings {
  theme: 'dark' | 'light';
  examDate: string; // ISO date
  name: string;
  timedDefaultSec: number;
  laMarks: number;
  showHinglish: boolean;
}

export interface ProgressState {
  learnedTopics: string[]; // topic ids marked learned
  attempts: Attempt[];
  bookmarks: string[]; // question ids
  mistakes: string[]; // question ids answered wrong
  mocks: MockResult[];
  recentTopics: { topicId: string; at: number }[];
  settings: Settings;
}
