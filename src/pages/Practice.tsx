import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Target,
  XCircle,
} from 'lucide-react';
import { chapters, questions as ALL } from '../data';
import type { Question, QuestionType } from '../data/types';
import { QUESTION_TYPE_LABELS } from '../data/types';
import { useProgress } from '../lib/store';
import { checkObjective, isAutoScored, sample, shuffle } from '../lib/quiz';
import { clock, cn } from '../lib/utils';
import { Card, Modal, SectionTitle, Toggle } from '../components/ui';
import { QuestionCard } from '../components/QuestionCard';

type Phase = 'setup' | 'running' | 'review';

interface Config {
  chapters: string[];
  types: QuestionType[];
  difficulties: string[];
  topic: string;
  onlyUnattempted: boolean;
  onlyIncorrect: boolean;
  onlyBookmarked: boolean;
  count: number;
  timed: boolean;
  durationSec: number;
  examMode: boolean;
}

const DEFAULT_CONFIG: Config = {
  chapters: [],
  types: [],
  difficulties: [],
  topic: '',
  onlyUnattempted: false,
  onlyIncorrect: false,
  onlyBookmarked: false,
  count: 10,
  timed: false,
  durationSec: 600,
  examMode: false,
};

export default function Practice() {
  const [params] = useSearchParams();
  const { state, recordAttempt, toggleBookmark, isBookmarked } = useProgress();

  const initialConfig = useMemo<Config>(() => {
    const mode = params.get('mode') || '';
    const cfg = { ...DEFAULT_CONFIG };
    if (mode === 'quick') cfg.count = 10;
    if (mode === 'chapter' && params.get('chapter')) cfg.chapters = [params.get('chapter')!];
    if (mode === 'topic' && params.get('topic')) cfg.topic = params.get('topic')!;
    if (mode === 'weak') cfg.onlyIncorrect = true;
    if (mode === 'revision') {
      cfg.onlyIncorrect = true;
      cfg.onlyBookmarked = true;
    }
    if (mode === 'timed') {
      cfg.timed = true;
      cfg.examMode = true;
      cfg.count = 15;
    }
    if (mode === 'mock') cfg.examMode = true;
    return cfg;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const [config, setConfig] = useState<Config>(initialConfig);
  const [phase, setPhase] = useState<Phase>('setup');
  const [autoStart, setAutoStart] = useState(false);

  const pool = useMemo(() => buildPool(ALL, config, state), [config, state]);

  const [session, setSession] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [index, setIndex] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  // Auto-start for deep-linked modes.
  useEffect(() => {
    if (!autoStart && (params.get('mode') === 'quick' || params.get('mode') === 'weak' || params.get('mode') === 'revision' || params.get('mode') === 'timed')) {
      setAutoStart(true);
      start(pool);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase !== 'running') return;
    const t = setInterval(() => {
      const e = Math.floor((Date.now() - startedAt) / 1000);
      setElapsed(e);
      if (config.timed && e >= config.durationSec) submit(true);
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, startedAt, config.timed, config.durationSec]);

  function start(list: Question[]) {
    const chosen = sample(list, Math.min(config.count, list.length));
    if (chosen.length === 0) return;
    setSession(chosen);
    setAnswers({});
    setRevealed({});
    setFlags({});
    setIndex(0);
    setStartedAt(Date.now());
    setElapsed(0);
    setPhase('running');
  }

  function submit(auto = false) {
    if (!auto) setConfirmSubmit(false);
    // Record attempts.
    session.forEach((q) => {
      const given = answers[q.id];
      if (given == null || given === '') return;
      const correct = isAutoScored(q) ? checkObjective(q, given) : null;
      recordAttempt({
        questionId: q.id,
        chapterId: q.chapterId,
        topicId: q.topicId,
        type: q.type,
        difficulty: q.difficulty,
        correct,
        given: typeof given === 'object' ? JSON.stringify(given) : String(given),
        at: Date.now(),
        mode: config.examMode ? 'practice-exam' : 'practice',
      });
    });
    setRevealed(Object.fromEntries(session.map((q) => [q.id, true])));
    setPhase('review');
    window.scrollTo({ top: 0 });
  }

  const current = session[index];
  const answeredCount = session.filter((q) => answers[q.id] != null && answers[q.id] !== '').length;

  const scored = useMemo(() => {
    let correct = 0;
    let total = 0;
    session.forEach((q) => {
      if (!isAutoScored(q)) return;
      total++;
      if (checkObjective(q, answers[q.id]) === true) correct++;
    });
    return { correct, total };
  }, [session, answers]);

  // ---- Setup screen --------------------------------------------------------
  if (phase === 'setup') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Practice Questions</h1>
          <p className="mt-1 text-sm text-slate-400">Build a custom practice set from the {ALL.length}-question bank, or jump into a quick mode.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Quick Practice', mode: 'quick', icon: <Target size={18} />, desc: '10 mixed questions' },
            { label: 'Weak Areas', mode: 'weak', icon: <AlertCircle size={18} />, desc: `${state.mistakes.length} to revise` },
            { label: 'Revision', mode: 'revision', icon: <RotateCcw size={18} />, desc: 'Mistakes + bookmarks' },
            { label: 'Timed Practice', mode: 'timed', icon: <Clock size={18} />, desc: '15 q · 10 min' },
          ].map((m) => (
            <button
              key={m.mode}
              className="card p-4 text-left transition hover:border-brand-400/40"
              onClick={() => {
                setConfig((c) => ({ ...c, ...(m.mode === 'quick' ? { count: 10, onlyIncorrect: false, onlyBookmarked: false } : m.mode === 'weak' ? { onlyIncorrect: true, onlyBookmarked: false, count: 10 } : m.mode === 'revision' ? { onlyIncorrect: true, onlyBookmarked: true, count: 15 } : { timed: true, examMode: true, count: 15 }) }));
                const list = buildPool(ALL, { ...config, ...(m.mode === 'quick' ? { count: 10, onlyIncorrect: false, onlyBookmarked: false } : m.mode === 'weak' ? { onlyIncorrect: true, onlyBookmarked: false } : m.mode === 'revision' ? { onlyIncorrect: true, onlyBookmarked: true } : { timed: true }) }, state);
                if (list.length) start(list);
              }}
            >
              <div className="mb-2 text-brand-300">{m.icon}</div>
              <div className="text-sm font-semibold text-slate-100">{m.label}</div>
              <div className="text-xs text-slate-400">{m.desc}</div>
            </button>
          ))}
        </div>

        <Card className="p-5">
          <SectionTitle icon={<Settings2 size={18} />} title="Custom practice set" subtitle="Filter the bank exactly how you want" />

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Chapters {config.chapters.length === 0 && <span className="text-slate-500">(all)</span>}</p>
              <div className="flex flex-wrap gap-2">
                {chapters.map((ch) => {
                  const on = config.chapters.includes(ch.id);
                  return (
                    <button
                      key={ch.id}
                      onClick={() => setConfig((c) => ({ ...c, chapters: on ? c.chapters.filter((x) => x !== ch.id) : [...c.chapters, ch.id] }))}
                      className={cn('rounded-lg border px-3 py-1.5 text-sm transition', on ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}
                    >
                      Ch {ch.number}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Question types {config.types.length === 0 && <span className="text-slate-500">(all)</span>}</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => {
                  const on = config.types.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => setConfig((c) => ({ ...c, types: on ? c.types.filter((x) => x !== t) : [...c.types, t] }))}
                      className={cn('rounded-lg border px-3 py-1.5 text-sm transition', on ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}
                    >
                      {QUESTION_TYPE_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Difficulty</p>
                <div className="flex flex-wrap gap-2">
                  {['easy', 'medium', 'hard'].map((d) => {
                    const on = config.difficulties.includes(d);
                    return (
                      <button
                        key={d}
                        onClick={() => setConfig((c) => ({ ...c, difficulties: on ? c.difficulties.filter((x) => x !== d) : [...c.difficulties, d] }))}
                        className={cn('rounded-lg border px-3 py-1.5 text-sm capitalize transition', on ? 'border-brand-400 bg-brand-500/15 text-brand-100' : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10')}
                      >
                        {d}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Number of questions</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={5}
                    value={config.count}
                    onChange={(e) => setConfig((c) => ({ ...c, count: Number(e.target.value) }))}
                    className="w-full accent-brand-500"
                  />
                  <span className="w-8 text-sm font-bold text-slate-200">{config.count}</span>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'onlyUnattempted', label: 'Unattempted only' },
                { key: 'onlyIncorrect', label: 'Previously incorrect only' },
                { key: 'onlyBookmarked', label: 'Bookmarked only' },
                { key: 'examMode', label: 'Exam mode (hide answers until submit)' },
              ].map((row) => (
                <div key={row.key} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                  <span className="text-sm text-slate-300">{row.label}</span>
                  <Toggle checked={(config as any)[row.key]} onChange={(v) => setConfig((c) => ({ ...c, [row.key]: v }))} label={row.label} />
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:col-span-2">
                <span className="text-sm text-slate-300">Timed practice</span>
                <div className="flex items-center gap-3">
                  <Toggle checked={config.timed} onChange={(v) => setConfig((c) => ({ ...c, timed: v }))} label="Timed" />
                  {config.timed && (
                    <select className="input !w-28 !py-1.5" value={config.durationSec} onChange={(e) => setConfig((c) => ({ ...c, durationSec: Number(e.target.value) }))}>
                      {[300, 600, 900, 1200].map((s) => <option key={s} value={s}>{s / 60} min</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button className="btn-primary" disabled={pool.length === 0} onClick={() => start(pool)}>
                <Play size={16} /> Start practice ({Math.min(config.count, pool.length)} of {pool.length})
              </button>
              {pool.length === 0 && <span className="text-sm text-amber-300">No questions match these filters. Try widening them.</span>}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // ---- Review screen -------------------------------------------------------
  if (phase === 'review') {
    return (
      <div className="space-y-6">
        <Card className="p-5">
          <h1 className="text-xl font-extrabold text-slate-100 sm:text-2xl">Practice complete</h1>
          <p className="mt-1 text-sm text-slate-400">Review every question, your answer, the model answer and the explanation below.</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-extrabold text-slate-100">{scored.total ? Math.round((scored.correct / scored.total) * 100) : 0}%</div>
              <div className="text-xs text-slate-400">objective score</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-extrabold text-emerald-300">{scored.correct}/{scored.total}</div>
              <div className="text-xs text-slate-400">auto-scored correct</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-extrabold text-slate-100">{answeredCount}/{session.length}</div>
              <div className="text-xs text-slate-400">attempted</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-2xl font-extrabold text-slate-100">{clock(elapsed)}</div>
              <div className="text-xs text-slate-400">time taken</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button className="btn-primary" onClick={() => { setPhase('setup'); setSession([]); }}>
              <Settings2 size={16} /> New practice set
            </button>
            <button className="btn-ghost" onClick={() => start(session)}>
              <RotateCcw size={16} /> Retry these
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          {session.map((q, i) => (
            <div key={q.id}>
              <div className="mb-2 flex items-center gap-2 text-xs">
                {isAutoScored(q) ? (
                  checkObjective(q, answers[q.id]) === true ? (
                    <span className="chip !border-emerald-400/30 !text-emerald-300"><CheckCircle2 size={13} /> Correct</span>
                  ) : answers[q.id] == null ? (
                    <span className="chip">Not answered</span>
                  ) : (
                    <span className="chip !border-rose-400/30 !text-rose-300"><XCircle size={13} /> Incorrect</span>
                  )
                ) : (
                  <span className="chip">Self-evaluated</span>
                )}
              </div>
              <QuestionCard
                q={q}
                index={i}
                total={session.length}
                answer={answers[q.id]}
                onAnswer={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                revealed
                bookmark={isBookmarked(q.id)}
                onBookmark={() => toggleBookmark(q.id)}
                showMeta
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ---- Running screen ------------------------------------------------------
  if (!current) {
    return (
      <Card className="p-6 text-center">
        <p className="text-slate-300">This practice set is empty.</p>
        <button className="btn-primary mt-3" onClick={() => setPhase('setup')}>Back to setup</button>
      </Card>
    );
  }

  const isRevealed = revealed[current.id] || config.examMode === false && revealed[current.id];
  const showFeedback = !!revealed[current.id];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200" onClick={() => setPhase('setup')}>
          <ArrowLeft size={15} /> Exit
        </button>
        <div className="flex items-center gap-2">
          {config.timed && (
            <span className={cn('chip', config.durationSec - elapsed < 60 && '!border-rose-400/40 !text-rose-300')}>
              <Clock size={13} /> {clock(Math.max(0, config.durationSec - elapsed))}
            </span>
          )}
          <span className="chip">{answeredCount}/{session.length} answered</span>
        </div>
      </div>

      {/* Navigator */}
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-1">
        {session.map((q, i) => {
          const done = answers[q.id] != null && answers[q.id] !== '';
          return (
            <button
              key={q.id}
              onClick={() => setIndex(i)}
              className={cn(
                'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-bold transition',
                i === index ? 'bg-brand-600 text-white' : done ? 'bg-emerald-500/20 text-emerald-300' : flags[q.id] ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-slate-400'
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <QuestionCard
        q={current}
        index={index}
        total={session.length}
        answer={answers[current.id]}
        onAnswer={(v) => setAnswers((a) => ({ ...a, [current.id]: v }))}
        revealed={showFeedback}
        bookmark={isBookmarked(current.id)}
        onBookmark={() => toggleBookmark(current.id)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button className="btn-ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)}>
          <ArrowLeft size={16} /> Previous
        </button>

        {!config.examMode && !showFeedback && (
          <button className="btn-primary" onClick={() => setRevealed((r) => ({ ...r, [current.id]: true }))} disabled={answers[current.id] == null || answers[current.id] === ''}>
            <CheckCircle2 size={16} /> Check answer
          </button>
        )}

        <button className="btn-ghost" onClick={() => setFlags((f) => ({ ...f, [current.id]: !f[current.id] }))}>
          <Flag size={16} className={flags[current.id] ? 'text-amber-300' : ''} /> {flags[current.id] ? 'Flagged' : 'Mark for review'}
        </button>

        <button className="btn-ghost" onClick={() => (index < session.length - 1 ? setIndex((i) => i + 1) : setConfirmSubmit(true))}>
          <SkipForward size={16} /> Skip
        </button>

        {index < session.length - 1 ? (
          <button className="btn-primary ml-auto" onClick={() => setIndex((i) => i + 1)}>
            Next <ArrowRight size={16} />
          </button>
        ) : (
          <button className="btn-primary ml-auto" onClick={() => setConfirmSubmit(true)}>
            Submit <CheckCircle2 size={16} />
          </button>
        )}
      </div>

      {!config.examMode && <p className="text-xs text-slate-500">Learning mode: answers and explanations appear as you check. Turn on Exam mode in setup to hide them until submission.</p>}

      <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Submit practice set?">
        <p className="text-sm text-slate-400">
          You have answered {answeredCount} of {session.length} questions. Once submitted you will see all answers and explanations.
        </p>
        <div className="mt-4 flex gap-2">
          <button className="btn-primary" onClick={() => submit()}>Submit now</button>
          <button className="btn-ghost" onClick={() => setConfirmSubmit(false)}>Keep practising</button>
        </div>
      </Modal>
    </div>
  );
}

function buildPool(all: Question[], config: Config, state: ReturnType<typeof useProgress>['state']): Question[] {
  let list = all.slice();
  if (config.chapters.length) list = list.filter((q) => config.chapters.includes(q.chapterId));
  if (config.topic) list = list.filter((q) => q.topicId === config.topic);
  if (config.types.length) list = list.filter((q) => config.types.includes(q.type));
  if (config.difficulties.length) list = list.filter((q) => config.difficulties.includes(q.difficulty));
  if (config.onlyBookmarked) list = list.filter((q) => state.bookmarks.includes(q.id));
  if (config.onlyIncorrect) list = list.filter((q) => state.mistakes.includes(q.id));
  if (config.onlyUnattempted) {
    const seen = new Set(state.attempts.map((a) => a.questionId));
    list = list.filter((q) => !seen.has(q.id));
  }
  return shuffle(list);
}
