import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Circle,
  ClipboardList,
  Flame,
  GraduationCap,
  HelpCircle,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useProgress } from '../lib/store';
import { overallStats, recommendNext, weakTopics } from '../lib/analytics';
import { chapters, getTopic, topicIndex } from '../data';
import { Card, ProgressBar, Ring, SectionTitle, Stat } from '../components/ui';
import { cn, daysUntil, relTime, toISODate } from '../lib/utils';

export default function Dashboard() {
  const { state, updateSettings } = useProgress();
  const stats = overallStats(state);
  const rec = recommendNext(state);
  const weak = weakTopics(state, 3, 4);
  const dLeft = daysUntil(state.settings.examDate);
  const recent = state.recentTopics
    .map((r) => ({ ...r, meta: topicIndex[r.topicId] }))
    .filter((r) => r.meta)
    .slice(0, 4);

  const checklist = [
    { label: 'Learn your first topic', done: state.learnedTopics.length > 0, to: '/learn' },
    { label: 'Answer 10 practice questions', done: stats.attempted >= 10, to: '/practice?mode=quick' },
    { label: 'Set your exam date', done: !!state.settings.examDate, to: '/settings' },
    { label: 'Clear a question from your mistake notebook', done: state.mistakes.length > 0, to: '/practice?mode=weak' },
    { label: 'Take a mock test', done: state.mocks.length > 0, to: '/mocks' },
  ];
  const doneCount = checklist.filter((c) => c.done).length;
  const allDone = doneCount === checklist.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-slate-400">
            {state.settings.name ? `Welcome back, ${state.settings.name}.` : 'Welcome back.'} Here is your exam readiness at a glance.
          </p>
          <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Dashboard</h1>
        </div>
        <Link to="/help" className="btn-ghost !py-2">
          <HelpCircle size={16} /> How to use this app
        </Link>
      </div>

      {/* Getting started — hidden once every step is done */}
      {!allDone && (
        <Card className="p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
              <Sparkles size={16} className="text-brand-300" /> Getting started
            </div>
            <span className="chip">{doneCount}/{checklist.length} done</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {checklist.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-brand-400/40"
              >
                {c.done ? <CheckCircle2 size={18} className="shrink-0 text-emerald-400" /> : <Circle size={18} className="shrink-0 text-slate-500" />}
                <span className={cn('text-sm', c.done ? 'text-slate-400 line-through' : 'text-slate-200')}>{c.label}</span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Hero */}
      <Card className="overflow-hidden">
        <div className="grid gap-6 p-5 sm:grid-cols-[auto,1fr] sm:items-center sm:p-6">
          <div className="flex items-center justify-center">
            <Ring value={stats.overallCompletion} size={132} stroke={11} sub="syllabus" />
          </div>
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="chip !bg-brand-500/15 !text-brand-200">
                <Sparkles size={13} /> {stats.topicsLearned}/{stats.totalTopics} topics learned
              </span>
              <span className="chip">
                <CheckCircle2 size={13} /> {stats.accuracy}% accuracy
              </span>
              <span className="chip">
                <ClipboardList size={13} /> {stats.attemptedUnique}/{stats.chapterStats.reduce((n, s) => n + s.bank, 0)} questions seen
              </span>
            </div>
            <div className="rounded-xl border border-brand-400/20 bg-brand-500/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand-300">
                <Flame size={13} /> Recommended next
              </p>
              <p className="mt-1 font-semibold text-slate-100">{rec.title}</p>
              <p className="mt-0.5 text-sm text-slate-400">{rec.reason}</p>
              <Link to={rec.to} className="btn-primary mt-3">
                {rec.cta} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link to="/learn" className="card p-4 transition hover:border-brand-400/40">
          <BookOpen className="mb-2 text-brand-300" size={20} />
          <div className="text-sm font-semibold text-slate-100">Learn Chapters</div>
          <div className="text-xs text-slate-400">8 chapters · {stats.totalTopics} topics</div>
        </Link>
        <Link to="/practice?mode=quick" className="card p-4 transition hover:border-brand-400/40">
          <Target className="mb-2 text-emerald-300" size={20} />
          <div className="text-sm font-semibold text-slate-100">Quick Practice</div>
          <div className="text-xs text-slate-400">10 mixed questions</div>
        </Link>
        <Link to="/mocks" className="card p-4 transition hover:border-brand-400/40">
          <GraduationCap className="mb-2 text-violet-300" size={20} />
          <div className="text-sm font-semibold text-slate-100">Mock Test</div>
          <div className="text-xs text-slate-400">CBSE-style paper</div>
        </Link>
        <Link to="/practice?mode=weak" className="card p-4 transition hover:border-brand-400/40">
          <TrendingUp className="mb-2 text-amber-300" size={20} />
          <div className="text-sm font-semibold text-slate-100">Weak Areas</div>
          <div className="text-xs text-slate-400">{state.mistakes.length} to revise</div>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<ClipboardList size={18} />} label="Questions attempted" value={stats.attempted} />
        <Stat icon={<CheckCircle2 size={18} />} label="Correct answers" value={`${stats.accuracy}%`} tone="green" />
        <Stat icon={<BookMarked size={18} />} label="Bookmarks" value={stats.bookmarks} tone="amber" />
        <Stat icon={<GraduationCap size={18} />} label="Mock tests taken" value={stats.mocks} tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chapter progress */}
        <div className="lg:col-span-2">
          <SectionTitle icon={<BookOpen size={18} />} title="Chapter-wise progress" subtitle="Learning coverage and accuracy per chapter" />
          <div className="space-y-3">
            {stats.chapterStats.map((s) => (
              <Link key={s.chapterId} to={`/learn/${s.chapterId}`} className="card block p-4 transition hover:border-brand-400/40">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/15 text-sm font-bold text-brand-200">{s.number}</span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-100">{s.title}</div>
                      <div className="text-xs text-slate-400">
                        {s.topicsLearned}/{s.topicsTotal} topics · {s.bank} questions
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-200">{s.completion}%</span>
                </div>
                <ProgressBar value={s.completion} tone={s.accuracy >= 70 ? 'green' : s.accuracy > 0 ? 'amber' : 'brand'} />
                {s.attempted > 0 && <div className="mt-1.5 text-xs text-slate-500">{s.attempted} attempts · {s.accuracy}% correct</div>}
              </Link>
            ))}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <CalendarClock size={16} className="text-brand-300" /> Exam countdown
            </div>
            {state.settings.examDate ? (
              <div className="text-center">
                <div className="text-4xl font-extrabold text-slate-100">{dLeft != null && dLeft >= 0 ? dLeft : 0}</div>
                <div className="text-xs uppercase tracking-wide text-slate-400">days remaining</div>
                <div className="mt-1 text-xs text-slate-500">Exam on {new Date(state.settings.examDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            ) : (
              <p className="text-sm text-slate-400">Set your exam date to see a live countdown.</p>
            )}
            <input
              type="date"
              className="input mt-3"
              value={state.settings.examDate}
              min={toISODate(new Date())}
              onChange={(e) => updateSettings({ examDate: e.target.value })}
            />
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <TrendingUp size={16} className="text-amber-300" /> Weakest subtopics
            </div>
            {weak.length === 0 ? (
              <p className="text-sm text-slate-400">Answer at least 3 questions on a topic to see accuracy here.</p>
            ) : (
              <div className="space-y-2">
                {weak.map((w) => (
                  <Link key={w.topicId} to={`/practice?mode=topic&topic=${w.topicId}`} className="block rounded-xl border border-white/10 bg-white/5 p-2.5 transition hover:border-amber-400/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm text-slate-200">{w.title}</span>
                      <span className="text-xs font-bold text-amber-300">{w.accuracy}%</span>
                    </div>
                    <ProgressBar value={w.accuracy} tone="amber" className="mt-1.5 h-1.5" />
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
              <BookOpen size={16} className="text-brand-300" /> Recently studied
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-slate-400">Topics you open will appear here.</p>
            ) : (
              <div className="space-y-2">
                {recent.map((r) => (
                  <Link key={r.topicId} to={`/learn/${r.meta.chapter.id}/${r.topicId}`} className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-2.5 text-sm transition hover:border-brand-400/40">
                    <span className="truncate text-slate-200">{r.meta.topic.title}</span>
                    <span className="shrink-0 text-xs text-slate-500">{relTime(r.at)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
