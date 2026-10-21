import { chapters, questionsByChapter, questionsByTopic, topicIndex } from '../data';
import type { ProgressState, QuestionType } from '../data/types';

export interface ChapterStat {
  chapterId: string;
  number: number;
  title: string;
  topicsTotal: number;
  topicsLearned: number;
  attempted: number;
  correct: number;
  accuracy: number;
  bank: number;
  completion: number; // learned topics % blended with question coverage
}

export function computeChapterStats(state: ProgressState): ChapterStat[] {
  return chapters.map((ch) => {
    const topicsTotal = ch.topics.length;
    const topicsLearned = ch.topics.filter((t) => state.learnedTopics.includes(t.id)).length;
    const attempts = state.attempts.filter((a) => a.chapterId === ch.id);
    const scored = attempts.filter((a) => a.correct !== null);
    const correct = scored.filter((a) => a.correct).length;
    const bank = (questionsByChapter[ch.id] || []).length;
    const attemptedUnique = new Set(attempts.map((a) => a.questionId)).size;
    const learnPart = topicsTotal ? topicsLearned / topicsTotal : 0;
    const attemptPart = bank ? Math.min(1, attemptedUnique / bank) : 0;
    return {
      chapterId: ch.id,
      number: ch.number,
      title: ch.title,
      topicsTotal,
      topicsLearned,
      attempted: scored.length,
      correct,
      accuracy: scored.length ? Math.round((correct / scored.length) * 100) : 0,
      bank,
      completion: Math.round((learnPart * 0.6 + attemptPart * 0.4) * 100),
    };
  });
}

export function overallStats(state: ProgressState) {
  const scored = state.attempts.filter((a) => a.correct !== null);
  const correct = scored.filter((a) => a.correct).length;
  const attemptedUnique = new Set(state.attempts.map((a) => a.questionId)).size;
  const totalTopics = chapters.reduce((n, c) => n + c.topics.length, 0);
  const learned = state.learnedTopics.length;
  const stats = computeChapterStats(state);
  const overall = stats.length ? Math.round(stats.reduce((n, s) => n + s.completion, 0) / stats.length) : 0;
  return {
    overallCompletion: overall,
    topicsLearned: learned,
    totalTopics,
    attempted: scored.length,
    attemptedUnique,
    correct,
    accuracy: scored.length ? Math.round((correct / scored.length) * 100) : 0,
    bookmarks: state.bookmarks.length,
    mistakes: state.mistakes.length,
    mocks: state.mocks.length,
    chapterStats: stats,
  };
}

/** Topics with enough attempts to judge, ordered weakest first. */
export function weakTopics(state: ProgressState, minAttempts = 3, limit = 5) {
  const byTopic = new Map<string, { attempted: number; correct: number }>();
  for (const a of state.attempts) {
    if (a.correct === null) continue;
    const rec = byTopic.get(a.topicId) || { attempted: 0, correct: 0 };
    rec.attempted++;
    if (a.correct) rec.correct++;
    byTopic.set(a.topicId, rec);
  }
  const out: { topicId: string; title: string; chapterId: string; attempted: number; correct: number; accuracy: number }[] = [];
  for (const [topicId, rec] of byTopic) {
    if (rec.attempted < minAttempts) continue;
    const meta = topicIndex[topicId];
    out.push({
      topicId,
      title: meta?.topic.title || topicId,
      chapterId: meta?.chapter.id || '',
      attempted: rec.attempted,
      correct: rec.correct,
      accuracy: Math.round((rec.correct / rec.attempted) * 100),
    });
  }
  return out.sort((a, b) => a.accuracy - b.accuracy).slice(0, limit);
}

export function typeBreakdown(state: ProgressState) {
  const map = new Map<QuestionType, { attempted: number; correct: number }>();
  for (const a of state.attempts) {
    if (a.correct === null) continue;
    const rec = map.get(a.type) || { attempted: 0, correct: 0 };
    rec.attempted++;
    if (a.correct) rec.correct++;
    map.set(a.type, rec);
  }
  return [...map.entries()].map(([type, rec]) => ({ type, ...rec, accuracy: rec.attempted ? Math.round((rec.correct / rec.attempted) * 100) : 0 }));
}

export interface Recommendation {
  title: string;
  reason: string;
  to: string;
  cta: string;
}

export function recommendNext(state: ProgressState): Recommendation {
  const stats = overallStats(state);

  if (state.attempts.length === 0 && state.learnedTopics.length === 0) {
    return { title: 'Start with Chapter 1', reason: 'You have not begun yet — open the first topic and read the concept.', to: '/learn/ch1', cta: 'Open Chapter 1' };
  }

  // 1. Finish an in-progress chapter (has some learning but not complete).
  const inProgress = stats.chapterStats
    .filter((s) => s.topicsLearned > 0 && s.topicsLearned < s.topicsTotal)
    .sort((a, b) => b.topicsLearned / b.topicsTotal - a.topicsLearned / a.topicsTotal)[0];
  if (inProgress) {
    return { title: `Continue Chapter ${inProgress.number}`, reason: `${inProgress.topicsLearned} of ${inProgress.topicsTotal} topics learned in ${inProgress.title}.`, to: `/learn/${inProgress.chapterId}`, cta: 'Continue learning' };
  }

  // 2. Weak topic with enough evidence.
  const weak = weakTopics(state, 3, 1)[0];
  if (weak && weak.accuracy < 70) {
    return { title: `Revise: ${weak.title}`, reason: `You are at ${weak.accuracy}% on this topic after ${weak.attempted} attempts. Read the explanation, then do topic practice.`, to: `/practice?mode=topic&topic=${weak.topicId}`, cta: 'Practise this topic' };
  }

  // 3. Untouched chapter.
  const untouched = stats.chapterStats.find((s) => s.topicsLearned === 0 && s.attempted === 0);
  if (untouched) {
    return { title: `Begin Chapter ${untouched.number}`, reason: `${untouched.title} has not been started yet.`, to: `/learn/${untouched.chapterId}`, cta: 'Open chapter' };
  }

  // 4. Mistakes to clear.
  if (state.mistakes.length > 0) {
    return { title: 'Clear your mistake notebook', reason: `${state.mistakes.length} question(s) answered incorrectly are waiting for revision.`, to: '/practice?mode=weak', cta: 'Revise mistakes' };
  }

  return { title: 'Take a mock test', reason: 'Your chapters look well covered — check your exam readiness with a timed paper.', to: '/mocks', cta: 'Start mock test' };
}

export function topicQuestionCount(topicId: string): number {
  return (questionsByTopic[topicId] || []).length;
}
