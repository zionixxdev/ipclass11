import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Flag,
  GraduationCap,
  Play,
  RotateCcw,
  SkipForward,
  Timer,
  Trophy,
} from 'lucide-react';
import { chapters, questions as ALL, questionsByChapter } from '../data';
import type { MockResult, Question, QuestionType } from '../data/types';
import { QUESTION_TYPE_LABELS } from '../data/types';
import { useProgress } from '../lib/store';
import { checkObjective, isAutoScored, sample } from '../lib/quiz';
import { clock, cn, uid } from '../lib/utils';
import { Card, Modal, SectionTitle } from '../components/ui';
import { QuestionCard } from '../components/QuestionCard';

interface SectionPlan {
  key: string;
  label: string;
  types: QuestionType[];
  count: number;
  marks: number;
}

const PRESETS: Record<string, SectionPlan[]> = {
  'Full paper (70 marks)': [
    { key: 'mcq', label: 'Section A · MCQ', types: ['mcq'], count: 15, marks: 1 },
    { key: 'ar', label: 'Section A · Assertion-Reason', types: ['assertion'], count: 4, marks: 1 },
    { key: 'vsa', label: 'Section B · Very Short Answer', types: ['vsa', 'truefalse', 'fillblank'], count: 8, marks: 1 },
    { key: 'sa', label: 'Section C · Short Answer', types: ['sa'], count: 5, marks: 2 },
    { key: 'la', label: 'Section D · Long Answer', types: ['la'], count: 3, marks: 4 },
    { key: 'case', label: 'Section E · Case-Based', types: ['case'], count: 2, marks: 4 },
    { key: 'py', label: 'Section F · Python (output / debug / program)', types: ['output', 'debug', 'program'], count: 3, marks: 2 },
  ],
  'Half paper (35 marks)': [
    { key: 'mcq', label: 'Section A · MCQ', types: ['mcq'], count: 10, marks: 1 },
    { key: 'ar', label: 'Section A · Assertion-Reason', types: ['assertion'], count: 3, marks: 1 },
    { key: 'vsa', label: 'Section B · Very Short Answer', types: ['vsa', 'truefalse', 'fillblank'], count: 5, marks: 1 },
    { key: 'sa', label: 'Section C · Short Answer', types: ['sa'], count: 3, marks: 2 },
    { key: 'la', label: 'Section D · Long Answer', types: ['la'], count: 2, marks: 4 },
    { key: 'case', label: 'Section E · Case-Based', types: ['case'], count: 1, marks: 4 },
  ],
  'Quick test (20 marks)': [
    { key: 'mcq', label: 'MCQ', types: ['mcq'], count: 10, marks: 1 },
    { key: 'ar', label: 'Assertion-Reason', types: ['assertion'], count: 2, marks: 1 },
    { key: 'sa', label: 'Short Answer', types: ['sa'], count: 2, marks: 2 },
    { key: 'py', label: 'Python', types: ['output', 'debug', 'program'], count: 1, marks: 2 },
  ],
};

type Phase = 'setup' | 'running' | 'review';

export default function MockTests() {
  const { state, addMock, recordAttempt, toggleBookmark, isBookmarked } = useProgress();
  const [presetName, setPresetName] = useState('Full paper (70 marks)');
  const [durationSec, setDurationSec] = useState(90 * 60);
  const [phase, setPhase] = useState<Phase>('setup');
  const [paper, setPaper] = useState<{ section: string; q: Question }[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<MockResult | null>(null);

  const plan = PRESETS[presetName];
  const totalMarks = useMemo(() => plan.reduce((n, s) => n + s.count * s.marks, 0), [plan]);

  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(e);
      if (e >= durationSec) finish();
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, startedAt, durationSec]);

  const generate = () => {
    const built: { section: string; q: Question }[] = [];
    for (const s of plan) {
      const pool = ALL.filter((q) => s.types.includes(q.type));
      const chosen = sample(pool, Math.min(s.count, pool.length));
      chosen.forEach((q) => built.push({ section: s.label, q }));
    }
    if (built.length === 0) return;
    setPaper(built);
    setAnswers({});
    setFlags({});
    setIndex(0);
    setStartedAt(Date.now());
    setElapsed(0);
    setResult(null);
    setPhase('running');
    window.scrollTo({ top: 0 });
  };

  function finish() {
    setConfirm(false);
    // Record attempts
    paper.forEach(({ q }) => {
      const given = answers[q.id];
      if (given == null || given === '') return;
      recordAttempt({
        questionId: q.id,
        chapterId: q.chapterId,
        topicId: q.topicId,
        type: q.type,
        difficulty: q.difficulty,
        correct: isAutoScored(q) ? checkObjective(q, given) : null,
        given: typeof given === 'object' ? JSON.stringify(given) : String(given),
        at: Date.now(),
        mode: 'mock',
      });
    });

    // Compute objective score + breakdowns
    let scoredMarks = 0;
    let objCorrect = 0;
    let objTotal = 0;
    const byChapter = new Map<string, { correct: number; total: number }>();
    const byType = new Map<QuestionType, { correct: number; total: number }>();
    paper.forEach(({ q }) => {
      const ch = byChapter.get(q.chapterId) || { correct: 0, total: 0 };
      const ty = byType.get(q.type) || { correct: 0, total: 0 };
      ch.total++;
      ty.total++;
      if (isAutoScored(q)) {
        objTotal++;
        const ok = checkObjective(q, answers[q.id]) === true;
        if (ok) {
          objCorrect++;
          ch.correct++;
          ty.correct++;
          scoredMarks += q.marks;
        }
      }
      byChapter.set(q.chapterId, ch);
      byType.set(q.type, ty);
    });

    const res: MockResult = {
      id: uid('mock'),
      at: Date.now(),
      totalMarks,
      scoredMarks,
      objective: { correct: objCorrect, total: objTotal },
      breakdown: [...byChapter.entries()].map(([chapterId, v]) => ({ chapterId, ...v })),
      typeBreakdown: [...byType.entries()].map(([type, v]) => ({ type, ...v })),
      durationSec: elapsed,
    };
    addMock(res);
    setResult(res);
    setPhase('review');
    window.scrollTo({ top: 0 });
  }

  // ---- Setup ----
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Mock Tests</h1>
          <p className="mt-1 text-sm text-slate-400">Generate a timed, section-wise paper from the question bank. Objective answers are auto-scored; descriptive answers are self-evaluated against model answers.</p>
        </div>

        <Card className="p-5">
          <SectionTitle icon={<GraduationCap size={18} />} title="Build your paper" subtitle="Practice pattern — configure it to match your teacher's marking scheme" />
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Paper pattern</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {Object.keys(PRESETS).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPresetName(p)}
                    className={cn('rounded-xl border p-3 text-left text-sm transition', p === presetName ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Duration</p>
                <select className="input" value={durationSec} onChange={(e) => setDurationSec(Number(e.target.value))}>
                  {[20, 45, 60, 90, 120, 180].map((m) => <option key={m} value={m * 60}>{m} minutes</option>)}
                </select>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Total marks</p>
                <div className="input flex items-center !py-2.5 text-slate-100">{totalMarks} marks</div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-slate-300">
                  <tr><th className="px-3 py-2 text-left">Section</th><th className="px-3 py-2 text-left">Questions</th><th className="px-3 py-2 text-left">Marks each</th><th className="px-3 py-2 text-left">Subtotal</th></tr>
                </thead>
                <tbody>
                  {plan.map((s) => (
                    <tr key={s.key} className="border-t border-white/5">
                      <td className="px-3 py-2 text-slate-200">{s.label}</td>
                      <td className="px-3 py-2 text-slate-400">{s.count}</td>
                      <td className="px-3 py-2 text-slate-400">{s.marks}</td>
                      <td className="px-3 py-2 text-slate-400">{s.count * s.marks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="rounded-xl border border-amber-400/20 bg-amber-500/5 p-3 text-xs text-amber-200">
              This is a practice paper generated from your question bank. It is not an official CBSE sample paper and does not claim to follow the latest official pattern.
            </p>

            <button className="btn-primary" onClick={generate}>
              <Play size={16} /> Generate &amp; start test
            </button>
          </div>
        </Card>

        {state.mocks.length > 0 && (
          <Card className="p-5">
            <SectionTitle icon={<BarChart3 size={18} />} title="Previous attempts" />
            <div className="space-y-2">
              {[...state.mocks].reverse().map((m) => (
                <div key={m.id} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                  <span className="text-slate-300">{new Date(m.at).toLocaleString('en-IN')}</span>
                  <span className="font-semibold text-slate-100">{m.scoredMarks}/{m.totalMarks} · {m.objective.correct}/{m.objective.total} objective</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ---- Running ----
  if (phase === 'running') {
    const current = paper[index];
    const answered = paper.filter(({ q }) => answers[q.id] != null && answers[q.id] !== '').length;
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200" onClick={() => setConfirm(true)}>
            <ArrowLeft size={15} /> End test
          </button>
          <div className="flex items-center gap-2">
            <span className={cn('chip', durationSec - elapsed < 300 && '!border-rose-400/40 !text-rose-300')}>
              <Clock size={13} /> {clock(Math.max(0, durationSec - elapsed))}
            </span>
            <span className="chip">{answered}/{paper.length} answered</span>
          </div>
        </div>

        <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
          {paper.map(({ q }, i) => {
            const done = answers[q.id] != null && answers[q.id] !== '';
            return (
              <button key={q.id} onClick={() => setIndex(i)} className={cn('grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition', i === index ? 'bg-brand-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-300' : flags[q.id] ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400')}>
                {i + 1}
              </button>
            );
          })}
        </div>

        {current && (
          <>
            <div className="chip !bg-brand-500/15 !text-brand-200">{current.section}</div>
            <QuestionCard
              q={current.q}
              index={index}
              total={paper.length}
              answer={answers[current.q.id]}
              onAnswer={(v) => setAnswers((a) => ({ ...a, [current.q.id]: v }))}
              revealed={false}
              bookmark={isBookmarked(current.q.id)}
              onBookmark={() => toggleBookmark(current.q.id)}
            />
          </>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button className="btn-ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}><ArrowLeft size={16} /> Previous</button>
          <button className="btn-ghost" onClick={() => setFlags((f) => ({ ...f, [paper[index].q.id]: !f[paper[index].q.id] }))}>
            <Flag size={16} className={flags[paper[index].q.id] ? 'text-amber-300' : ''} /> Mark for review
          </button>
          <button className="btn-ghost" onClick={() => (index < paper.length - 1 ? setIndex((i) => i + 1) : setConfirm(true))}><SkipForward size={16} /> Skip</button>
          {index < paper.length - 1 ? (
            <button className="btn-primary ml-auto" onClick={() => setIndex((i) => i + 1)}>Next <ArrowRight size={16} /></button>
          ) : (
            <button className="btn-primary ml-auto" onClick={() => setConfirm(true)}>Submit test <CheckCircle2 size={16} /></button>
          )}
        </div>

        <Modal open={confirm} onClose={() => setConfirm(false)} title="Submit mock test?">
          <p className="text-sm text-slate-400">You have answered {answered} of {paper.length} questions. Objective questions are auto-scored; descriptive answers are shown with model answers for self-evaluation.</p>
          <div className="mt-4 flex gap-2">
            <button className="btn-primary" onClick={finish}>Submit</button>
            <button className="btn-ghost" onClick={() => setConfirm(false)}>Continue</button>
          </div>
        </Modal>
      </div>
    );
  }

  // ---- Review ----
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-violet-500/15 text-violet-300"><Trophy size={24} /></div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-100">Mock test result</h1>
            <p className="text-sm text-slate-400">Auto-scored objective marks · {clock(elapsed)} taken</p>
          </div>
        </div>

        {result && (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-extrabold text-slate-100">{result.scoredMarks}/{result.totalMarks}</div>
                <div className="text-xs text-slate-400">objective marks</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-extrabold text-emerald-300">{result.objective.correct}/{result.objective.total}</div>
                <div className="text-xs text-slate-400">objective correct</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-extrabold text-slate-100">{result.objective.total ? Math.round((result.objective.correct / result.objective.total) * 100) : 0}%</div>
                <div className="text-xs text-slate-400">accuracy</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-2xl font-extrabold text-slate-100">{paper.length}</div>
                <div className="text-xs text-slate-400">questions</div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter-wise</p>
                <div className="space-y-1.5">
                  {result.breakdown.map((b) => {
                    const ch = chapters.find((c) => c.id === b.chapterId);
                    return (
                      <div key={b.chapterId} className="flex items-center justify-between text-sm">
                        <span className="text-slate-300">Ch {ch?.number}: {ch?.title}</span>
                        <span className="font-semibold text-slate-200">{b.correct}/{b.total}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Question-type-wise</p>
                <div className="space-y-1.5">
                  {result.typeBreakdown.map((b) => (
                    <div key={b.type} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{QUESTION_TYPE_LABELS[b.type]}</span>
                      <span className="font-semibold text-slate-200">{b.correct}/{b.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => { setPhase('setup'); setPaper([]); }}><RotateCcw size={16} /> New paper</button>
          <button className="btn-ghost" onClick={generate}><Timer size={16} /> Retake</button>
          <Link to="/progress" className="btn-ghost"><BarChart3 size={16} /> View progress</Link>
        </div>
      </Card>

      <div className="space-y-4">
        {paper.map(({ q, section }, i) => (
          <div key={q.id}>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="chip">{section}</span>
              {isAutoScored(q) ? (
                checkObjective(q, answers[q.id]) === true ? (
                  <span className="chip !border-emerald-400/30 !text-emerald-300"><CheckCircle2 size={13} /> Correct</span>
                ) : answers[q.id] == null ? (
                  <span className="chip">Not answered</span>
                ) : (
                  <span className="chip !border-rose-400/30 !text-rose-300">Incorrect</span>
                )
              ) : (
                <span className="chip">Self-evaluated</span>
              )}
            </div>
            <QuestionCard q={q} index={i} total={paper.length} answer={answers[q.id]} onAnswer={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))} revealed bookmark={isBookmarked(q.id)} onBookmark={() => toggleBookmark(q.id)} />
          </div>
        ))}
      </div>
    </div>
  );
}
