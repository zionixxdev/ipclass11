import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Download, RotateCcw, Target, TrendingUp } from 'lucide-react';
import { chapters } from '../data';
import { QUESTION_TYPE_LABELS } from '../data/types';
import { useProgress } from '../lib/store';
import { computeChapterStats, overallStats, typeBreakdown, weakTopics } from '../lib/analytics';
import { Card, EmptyState, ProgressBar, SectionTitle, Stat } from '../components/ui';

const tooltipStyle = {
  background: 'rgba(15,23,42,0.95)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  fontSize: 12,
  color: '#e2e8f0',
};

export default function Progress() {
  const { state, exportData, resetProgress } = useProgress();
  const stats = overallStats(state);
  const chapterStats = computeChapterStats(state);
  const types = typeBreakdown(state);
  const weak = weakTopics(state, 3, 6);

  // Daily accuracy over last 14 days
  const daily = (() => {
    const days: { day: string; attempts: number; accuracy: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      const start = d.getTime();
      const end = start + 86400000;
      const dayAttempts = state.attempts.filter((a) => a.at >= start && a.at < end && a.correct !== null);
      const correct = dayAttempts.filter((a) => a.correct).length;
      days.push({
        day: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        attempts: dayAttempts.length,
        accuracy: dayAttempts.length ? Math.round((correct / dayAttempts.length) * 100) : 0,
      });
    }
    return days;
  })();

  const chapterChart = chapterStats.map((s) => ({ name: `Ch ${s.number}`, accuracy: s.accuracy, completion: s.completion }));
  const typeChart = types.map((t) => ({ name: QUESTION_TYPE_LABELS[t.type], accuracy: t.accuracy, attempted: t.attempted }));
  const radarData = chapterStats.map((s) => ({ chapter: `Ch${s.number}`, completion: s.completion }));

  if (state.attempts.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Progress</h1>
        <EmptyState
          icon={<BarChart3 size={22} />}
          title="No activity yet"
          message="Your analytics build up as you learn topics and answer questions. Take a quick practice set to get started."
          action={<Link to="/practice?mode=quick" className="btn-primary mt-2">Start quick practice</Link>}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 sm:text-3xl">Progress</h1>
          <p className="mt-1 text-sm text-slate-400">All figures come from your saved activity on this device.</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={exportData}><Download size={16} /> Export</button>
          <button
            className="btn-ghost"
            onClick={() => {
              if (confirm('Reset all progress? This permanently clears your learned topics, attempts, bookmarks and mock results on this device.')) resetProgress();
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={<Target size={18} />} label="Syllabus completion" value={`${stats.overallCompletion}%`} />
        <Stat icon={<TrendingUp size={18} />} label="Overall accuracy" value={`${stats.accuracy}%`} tone="green" />
        <Stat icon={<BarChart3 size={18} />} label="Questions attempted" value={stats.attempted} tone="violet" />
        <Stat icon={<BarChart3 size={18} />} label="Mock tests" value={stats.mocks} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle icon={<BarChart3 size={18} />} title="Chapter completion & accuracy" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chapterChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completion" name="Completion %" fill="#598cff" radius={[6, 6, 0, 0]} />
                <Bar dataKey="accuracy" name="Accuracy %" fill="#34d399" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={<TrendingUp size={18} />} title="Accuracy trend (14 days)" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="attempts" name="Attempts" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={<Target size={18} />} title="Performance by question type" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeChart} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={120} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="accuracy" name="Accuracy %" radius={[0, 6, 6, 0]}>
                  {typeChart.map((t, i) => (
                    <Cell key={i} fill={t.accuracy >= 70 ? '#34d399' : t.accuracy >= 40 ? '#f59e0b' : '#f43f5e'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle icon={<BarChart3 size={18} />} title="Syllabus coverage radar" />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="chapter" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Radar dataKey="completion" name="Completion %" stroke="#598cff" fill="#598cff" fillOpacity={0.35} />
                <Tooltip contentStyle={tooltipStyle} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-4">
          <SectionTitle title="Chapter breakdown" />
          <div className="space-y-3">
            {chapterStats.map((s) => (
              <div key={s.chapterId}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-slate-300">Ch {s.number} · {s.title}</span>
                  <span className="text-slate-400">{s.attempted ? `${s.accuracy}%` : '—'}</span>
                </div>
                <ProgressBar value={s.completion} tone={s.accuracy >= 70 ? 'green' : s.attempted ? 'amber' : 'brand'} />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <SectionTitle title="Weakest subtopics" subtitle="Topics with at least 3 attempts" />
          {weak.length === 0 ? (
            <p className="text-sm text-slate-400">Not enough data yet — answer at least 3 questions on a topic.</p>
          ) : (
            <div className="space-y-2">
              {weak.map((w) => (
                <Link key={w.topicId} to={`/practice?mode=topic&topic=${w.topicId}`} className="block rounded-xl border border-white/10 bg-white/5 p-3 transition hover:border-amber-400/40">
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
      </div>

      {state.mocks.length > 0 && (
        <Card className="p-4">
          <SectionTitle title="Mock test history" />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={state.mocks.map((m, i) => ({ name: `#${i + 1}`, score: m.totalMarks ? Math.round((m.scoredMarks / m.totalMarks) * 100) : 0 }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" name="Score %" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      <p className="text-center text-xs text-slate-500">Chapters in syllabus: {chapters.length} · Analytics update instantly from local storage.</p>
    </div>
  );
}
